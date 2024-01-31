const TagLabel = ({
    backgroundColor = "black",
    textColor = "white",
    children,
}) => {
    return (
        <div className="text-xs font-bold uppercase tracking-wide inline-flex items-center justify-center px-2 py-1 rounded-full  leading-none bg-slate-500 text-slate-100">
            {children}
        </div>
    );
};

export default TagLabel;
