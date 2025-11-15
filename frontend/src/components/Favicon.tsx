import { useEffect } from 'react';

const Favicon = () => {
  useEffect(() => {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (link) {
      link.href = '/favicon.svg';
    }
  }, []);

  return null;
};

export default Favicon;