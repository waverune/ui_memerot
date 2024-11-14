export const Navbar = () => {
  return (
    <nav className="flex items-center justify-between p-4 w-full">
      <div className="text-2xl font-bold text-pink-500">MemeROt</div>
      <div className="flex gap-6">
        <a href="#" className="hover:text-pink-500 transition-colors">Trade</a>
        <a href="#" className="hover:text-pink-500 transition-colors">Explore</a>
        <a href="#" className="hover:text-pink-500 transition-colors">Pool</a>
      </div>
      <button className="bg-black text-white px-4 py-2 rounded-lg">
        Connect Wallet
      </button>
    </nav>
  );
}; 