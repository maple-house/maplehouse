import redis from "../redis/config";
import { AppError } from "@/app/utils/error/AppError";
import { safe_compare } from "@/app/utils/security/safe_compare";
import crypto from "crypto";


//Constants 
const OTP_LENGTH = 6;
const OTP_RETRIES = 3;
const OTP_VERIFICATION_ATTEMPTS = 3;
const OTP_EXPIRY_TIME_SECONDS = 10 * 60; //10 Minutes
const OTP_META_EXPIRY_TIME_SECONDS = 24 * 60 * 60; //24 Hours
const OTP_RESEND_COOLDOWN_DURATION_SECONDS = 60 //1 Minute

//Prefixes
const OTP_PREFIX = "otp:";
const OTP_META_PREFIX = "otp_meta:"

//DB Structure
type OTP = {
    hash : string;
    attempts : string;
}

type OTP_META = {
    resend_count : string;
    created_at : string;
    expired_at : string;
    lockdown : "locked" | "open";
}


export async function createOTP(email : string) {

    //Get OTP Meta Data
    const otp_meta_data = await redis.hgetall(OTP_META_PREFIX + email) as OTP_META;

    //Get current timestamp
    const current_time = new Date().getTime();

    //Check if OTP Meta Data exists 
    if(Object.keys(otp_meta_data).length !== 0) {

        //OTP Meta Data Exists 
        //This implies that this is a OTP resend attempt

        //Check if the account is in lockdown
        if(otp_meta_data.lockdown === "locked") {
            throw new AppError("The account is in lockdown",true);
        } 

        //Check if the resend attempts are too frequent
        if(current_time - parseInt(otp_meta_data.created_at) < (OTP_RESEND_COOLDOWN_DURATION_SECONDS * 1000)) {
            throw new AppError("OTP requests are too frequent",true);
        }

        //Check if resend count is exceeded
        if(parseInt(otp_meta_data.resend_count) >= OTP_RETRIES) {
            throw new AppError("OTP exhausted",true);
        }
    }

    //Create new OTP
    const random_bits = crypto.randomInt(0, 10 ** OTP_LENGTH);
    const otp = random_bits.toString().padStart(OTP_LENGTH, "0");

    //Get OTP Secret from the env
    const secret = process.env.OTP_SECRET;
    if (!secret) throw new AppError("OTP_SECRET is not set",false);

    //Hash the OTP with phone number
    const hash = crypto.createHmac("sha256", secret).update(`${email}:${otp}`).digest("hex");

    //Initiate redis pipeline
    const pipeline = redis.pipeline()

    //Replace the existing OTP object or create new one if expired in redis
    pipeline.hset(OTP_PREFIX + email, {
        hash,
        attempts : 0 //New OTP resets the attempts at validation
    });

    //Set expiry time for the OTP
    pipeline.expire(OTP_PREFIX + email,OTP_EXPIRY_TIME_SECONDS);

    //Increment the resend count in OTP Meta Data
    pipeline.hincrby(OTP_META_PREFIX + email, "resend_count", 1); //If the key doesn't exist it creates key and sets the resend count to 0
    
    //Set new created at time for the OTP in Meta Data
    pipeline.hset(OTP_META_PREFIX + email,"created_at",current_time); //Adds the property created_at if it doesn't exist with corresponding value

    //Set new expired at time for the OTP in Meta Data
    pipeline.hset(OTP_META_PREFIX + email,"expired_at",current_time + OTP_EXPIRY_TIME_SECONDS * 1000) //Similar to created_at

    //Set lockdown flag as open
    pipeline.hset(OTP_META_PREFIX + email,"lockdown","open");

    //Set Meta Data Expiry
    pipeline.expire(OTP_META_PREFIX + email, OTP_META_EXPIRY_TIME_SECONDS);

    //Execute the redis queries
    await pipeline.exec();

    //Returns the OTP
    return {otp}

}

export async function verifyOTP(otp : string, email : string) {


    //Get OTP Meta Data
    const otp_meta_data = await redis.hgetall(OTP_META_PREFIX + email) as OTP_META;

    //Get OTP Data
    const otp_data = await redis.hgetall(OTP_PREFIX + email) as OTP;

    //Get current timestamp
    const current_time = new Date().getTime();

    //OTP Meta Data must exist throw error otherwise
    if(Object.keys(otp_meta_data).length === 0) {
        throw new AppError("OTP exists without meta data", false);
    }

    //Check if the account is in lockdown
    if(otp_meta_data.lockdown === "locked") {
        throw new AppError("The account is in lockdown",true);
    } 

    //Check if the otp data exists
    if(Object.keys(otp_data).length === 0) {
        
        //Check if the otp expired_at time has elapsed
        if(parseInt(otp_meta_data.expired_at) < current_time) {
            throw new AppError("OTP expired",true)
        }

        //If the otp attempts are exhausted 
        throw new AppError("OTP attempts exhausted",true);

    }

    //Check if the OTP attempts are exhausted
    if(parseInt(otp_data.attempts) >= OTP_VERIFICATION_ATTEMPTS) {

        //Delete the OTP Data
        await redis.del(OTP_PREFIX + email);

        //Throw error
        throw new AppError("OTP attempts exhausted",true)
    }

    //Check if the resend are available
    if(parseInt(otp_meta_data.resend_count) >= OTP_RETRIES && parseInt(otp_data.attempts) >= OTP_VERIFICATION_ATTEMPTS - 1) {
        
        //Initiate Local Pipeline
        const pipeline = redis.pipeline()

        //Delete OTP data
        pipeline.del(OTP_PREFIX + email);
        
        //If resends are not available lockdown the account
        pipeline.hset(OTP_META_PREFIX + email,"lockdown","locked");

        //Now OTP Meta Data expires when lockdown ends
        pipeline.expire(OTP_META_PREFIX + email,OTP_META_EXPIRY_TIME_SECONDS);

        //Execute Pipeline
        await pipeline.exec()

    }

    //Get OTP Secret from the env
    const secret = process.env.OTP_SECRET;
    if (!secret) throw new AppError("OTP_SECRET is not set",false);

    //Get hashed OTP 
    const hash = crypto.createHmac("sha256", secret).update(`${email}:${otp}`).digest("hex");

    //Compare hashes
    const result = safe_compare(hash,otp_data.hash);

    //Invalid OTP
    if(!result) {
        //Increment the attempts counter by 1
        await redis.hincrby(OTP_PREFIX + email,"attempts",1);

        //Throw error
        throw new AppError("Invalid OTP", true);
    }


    //OTP is valid

    //Create Pipeline
    const pipeline = redis.pipeline();

    //Delete OTP Data
    pipeline.del(OTP_PREFIX + email);

    //Delete OTP Meta Data
    pipeline.del(OTP_META_PREFIX + email);

    await pipeline.exec()

}


export async function getOTPState(email : string) {

    //Get OTP Meta Data
    const otp_meta_data = await redis.hgetall(OTP_META_PREFIX + email) as OTP_META;

    //Get OTP Data
    const otp_data = await redis.hgetall(OTP_PREFIX + email) as OTP;

    //OTP Meta Data must exist throw error otherwise
    if(Object.keys(otp_meta_data).length === 0) {
        throw new AppError("OTP exists without meta data", false);
    }

    //The attempts left to verify the OTP
    let verification_attempts = 0;

    //Check if the otp data exists
    if(Object.keys(otp_data).length === 0) {
        verification_attempts = 0;
    }else {
        verification_attempts = parseInt(otp_data.attempts);
    }

    //OTP Resends remaining
    const resend_remaining = Math.max(0, OTP_RETRIES - parseInt(otp_meta_data.resend_count));

    //OTP Meta Data TTL
    const ttl_otp_meta_data = await redis.pttl(OTP_META_PREFIX + email);

    //If the account is in lockdown
    const lockdown = otp_meta_data.lockdown === "locked" ?  ttl_otp_meta_data : null;
    
    //Return Data
    return {
        verification_attempts,
        resend_remaining,
        lockdown,
        max_verification_attempts : OTP_VERIFICATION_ATTEMPTS,
        max_otp_resends : OTP_RETRIES
    }
}