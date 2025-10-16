const Footer = () => {
  return (
    <footer className="w-full py-6 px-4 md:px-8 z-10">
      <div className="max-w-6xl mx-auto text-center text-sm text-neutral-500">
        <p>&copy; {new Date().getFullYear()} Stellar Links. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
