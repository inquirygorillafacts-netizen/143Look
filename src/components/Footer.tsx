const Footer = () => {
  return (
    <footer className="text-center py-4 px-6 md:px-8 text-sm text-gray-500 bg-transparent absolute bottom-0 left-0 right-0 z-20">
      <p>&copy; {new Date().getFullYear()} Cosmic Links. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
