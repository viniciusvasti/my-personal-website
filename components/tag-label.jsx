const TagLabel = ({ children }) => {
    return (
        <div className="text-xs font-medium font-mono uppercase tracking-wide inline-flex items-center justify-center px-2 py-1 rounded-md  leading-none bg-slate-100 text-slate-500">
            {children}
        </div>
    );
};

export default TagLabel;
