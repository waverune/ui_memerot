import { Link } from "react-router-dom"


import Telegram from '../../assets/Telegram.png'
import TwitterIcon from '../../assets/X.png'
const Footer = () => {
  return (
    <footer className="w-full bg-[#0a0e1a] py-4 px-6 border-t border-gray-800 fixed bottom-0 left-0 right-0">
     <div className="flex justify-center space-x-6">
        <Link
          to="https://t.me/memerot"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-gray-300 hover:text-[#d355e2] transition-colors"
        >
          <img src={Telegram} alt="Telegram" className="w-5 h-5 mr-1" />
          <span className="hidden md:inline">Telegram</span>
        </Link>

        <Link
          to="https://x.com/memer0t"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-gray-300 hover:text-[#d355e2] transition-colors"
        >
          <img src={TwitterIcon} alt="Twitter" className="w-5 h-5 mr-1" />
          <span className="hidden md:inline">Twitter</span>
        </Link>
      </div>
    </footer>
  )
}
export default Footer;
