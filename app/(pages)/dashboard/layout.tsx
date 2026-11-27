type Props = {
  children: React.ReactNode;
};

const DashboardLayout = ({ children }: Props) => {
  return (
    <div className="flex items-center justify-center w-screen h-screen flex-col">
      {children}
    </div>
  );
};

export default DashboardLayout;
