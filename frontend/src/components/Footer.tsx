export default function Footer() {
  return (
    <footer className="bg-brand-dark-bg text-slate-400 pt-16 pb-10 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12">
          <div className="md:col-span-2 space-y-4">
            <span className="inline-block text-2xl font-extrabold tracking-tight text-white">
              FIT<span className="text-brand-green">LOOK</span>
            </span>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Nuestra tecnologia redefine tu rendimiento y estilo. Prueba todo
              nuestro catalogo virtualmente antes de que llegue a tu puerta.
            </p>
            <div className="flex items-center gap-3 pt-2">
              {["fa-instagram", "fa-facebook-f", "fa-youtube", "fa-x-twitter"].map(
                (icon) => (
                  <a
                    key={icon}
                    href="#"
                    className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:bg-brand-green hover:text-slate-900 transition-all text-xs"
                  >
                    <i className={`fa-brands ${icon}`} />
                  </a>
                )
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-white text-xs font-bold uppercase tracking-wider">
              Tienda
            </h3>
            <ul className="space-y-2 text-xs">
              {["Hombre", "Mujer", "Nuevo Ingreso", "Colecciones", "Probador AR"].map(
                (item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-white text-xs font-bold uppercase tracking-wider">
              Soporte
            </h3>
            <ul className="space-y-2 text-xs">
              {["Envios", "Devoluciones", "Guia de Tallas", "Contacto", "Preguntas Frecuentes"].map(
                (item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-white text-xs font-bold uppercase tracking-wider">
              Legal
            </h3>
            <ul className="space-y-2 text-xs">
              {["Terminos de Servicio", "Privacidad", "Uso de Cookies", "Garantia de AR"].map(
                (item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-white transition-colors">
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>&copy; 2026 FITLOOK Athletics. Todos los derechos reservados.</p>
          <div className="flex items-center gap-3">
            <span className="tracking-widest font-semibold uppercase text-[10px] text-slate-400">
              Secure Checkout
            </span>
            <i className="fa-brands fa-cc-visa text-lg text-slate-400" />
            <i className="fa-brands fa-cc-mastercard text-lg text-slate-400" />
          </div>
        </div>
      </div>
    </footer>
  );
}
