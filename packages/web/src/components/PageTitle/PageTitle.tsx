const PageTitle = ({ title }: { title: string }) => {
  return (
    <div className="w-full text-left text-foreground text-lg font-bold p-[8px]">
      {title}
    </div>
  );
};

export default PageTitle;
