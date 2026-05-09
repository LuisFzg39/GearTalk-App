export const EmptyState = ({ message }: { message: string }) => {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 sm:px-10 text-center shadow-sm">
      <p className="text-gray-700 text-base leading-relaxed max-w-md mx-auto">{message}</p>
    </div>
  );
};
