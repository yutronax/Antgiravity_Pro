export default function Footer() {
  return (
    <footer className="py-12 border-t border-white/5">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <div className="text-xl font-bold tracking-tighter mb-2">
              <span className="gradient-text">STAJ</span>
              <span className="text-white ml-1 opacity-70">BULUCU</span>
            </div>
            <p className="text-xs text-white/40 max-w-[300px]">
              Geleceğin mühendisleri için en iyi staj fırsatlarını yapay zeka ile derliyoruz.
            </p>
          </div>
          
          <div className="flex gap-12 text-sm text-white/50">
            <div className="flex flex-col gap-2">
              <span className="text-white/80 font-bold mb-1">Platform</span>
              <a href="#" className="hover:text-primary transition-colors">İlanlar</a>
              <a href="#" className="hover:text-primary transition-colors">Şirketler</a>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-white/80 font-bold mb-1">Yasal</span>
              <a href="#" className="hover:text-primary transition-colors">Gizlilik</a>
              <a href="#" className="hover:text-primary transition-colors">Şartlar</a>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center text-xs text-white/20">
          © {new Date().getFullYear()} Staj Bulucu. Tüm hakları saklıdır.
        </div>
      </div>
    </footer>
  );
}
