import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

export type LegalDocType = "terms" | "privacy";
type LegalSection = { heading: string; paragraphs: string[] };

const LEGAL_LAST_UPDATED = "23 de septiembre de 2026";

const TERMS_INTRO =
  "Los presentes Términos y Condiciones regulan el acceso y uso de la plataforma web FITLOOK, incluido el módulo de Probador Virtual 2D, operada por FITLOOK PERÚ S.A.C., identificada con RUC N.° 20609876541, con domicilio en Av. Javier Prado Este 1245, San Isidro, Lima, Perú (en adelante, \"FITLOOK\" o \"la Empresa\"). Al registrarte, navegar o realizar una compra en la plataforma, aceptas íntegramente estos Términos y Condiciones, así como nuestra Política de Privacidad.";

const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: "Objeto del servicio",
    paragraphs: [
      "FITLOOK es una plataforma de comercio electrónico dedicada a la venta de indumentaria y calzado deportivo, que incluye un módulo de Probador Virtual 2D. Esta herramienta permite al usuario visualizar de forma referencial cómo le quedaría una prenda, a partir de las medidas o fotografías que voluntariamente proporcione.",
    ],
  },
  {
    heading: "Capacidad legal y registro de cuenta",
    paragraphs: [
      "El uso de la plataforma está dirigido a personas mayores de 18 años con plena capacidad de ejercicio, conforme al Código Civil peruano. Los menores de edad podrán utilizar el servicio únicamente bajo la supervisión y consentimiento de su padre, madre o tutor legal, quien asumirá la responsabilidad de las compras realizadas.",
      "Para acceder a determinadas funcionalidades (compras, favoritos, Probador Virtual) es necesario crear una cuenta con información veraz, exacta y actualizada. El usuario es responsable de mantener la confidencialidad de sus credenciales y de toda actividad realizada desde su cuenta.",
    ],
  },
  {
    heading: "Información de productos y precios",
    paragraphs: [
      "En cumplimiento del Código de Protección y Defensa del Consumidor (Ley N.° 29571), FITLOOK se compromete a ofrecer información veraz, suficiente, clara y oportuna sobre las características, precios, tallas y disponibilidad de los productos. Los precios se muestran en soles (S/) e incluyen los impuestos de ley aplicables, salvo indicación expresa en contrario.",
      "FITLOOK se reserva el derecho de modificar precios, promociones y stock sin previo aviso; dichos cambios no afectarán a los pedidos ya confirmados.",
    ],
  },
  {
    heading: "Proceso de compra y medios de pago",
    paragraphs: [
      "La compra se perfecciona una vez que el usuario completa el proceso de pago y recibe la confirmación del pedido por correo electrónico o dentro de la plataforma. FITLOOK utiliza pasarelas de pago de terceros debidamente autorizadas, las cuales procesan la información de pago bajo sus propios estándares de seguridad; FITLOOK no almacena números completos de tarjetas.",
    ],
  },
  {
    heading: "Envíos y plazos de entrega",
    paragraphs: [
      "Los plazos de entrega informados en la plataforma son estimados y pueden variar según la zona de entrega dentro del territorio peruano. FITLOOK informará al usuario ante cualquier demora significativa respecto del plazo ofrecido al momento de la compra.",
    ],
  },
  {
    heading: "Derecho de desistimiento",
    paragraphs: [
      "De conformidad con el artículo 45 del Código de Protección y Defensa del Consumidor, en las contrataciones a distancia el consumidor tiene derecho a desistirse de la compra sin expresión de causa dentro de un plazo de 7 días calendario contados desde la recepción del producto, siempre que este se encuentre en las mismas condiciones en que fue entregado, con sus etiquetas y empaque original.",
      "Para ejercer este derecho, el usuario debe comunicarse a través de los canales de atención indicados en la sección de Contacto.",
    ],
  },
  {
    heading: "Cambios, devoluciones y garantías",
    paragraphs: [
      "Conforme al Código de Protección y Defensa del Consumidor, el usuario tiene derecho a la reparación, reposición o devolución del importe pagado cuando el producto presente defectos de fabricación o no corresponda a lo ofrecido, dentro de los plazos y condiciones detallados en nuestra política de cambios y devoluciones publicada en la plataforma.",
    ],
  },
  {
    heading: "Uso del Probador Virtual 2D",
    paragraphs: [
      "El Probador Virtual 2D es una herramienta referencial que utiliza las medidas, fotografías o datos corporales que el usuario decide ingresar de forma voluntaria, con la finalidad de sugerir una talla o visualización aproximada de la prenda. FITLOOK no garantiza que la prenda física coincida exactamente con la visualización generada, dado que esta depende de factores como el tipo de tela, el corte de la prenda y la calidad de la información proporcionada por el usuario.",
      "El tratamiento de las medidas y/o imágenes corporales usadas en esta funcionalidad se rige por la Política de Privacidad, y requiere el consentimiento expreso del usuario, por tratarse de datos que pueden calificar como sensibles conforme a la Ley N.° 29733.",
    ],
  },
  {
    heading: "Propiedad intelectual",
    paragraphs: [
      "Todos los contenidos de la plataforma (marca FITLOOK, logotipos, diseños, fotografías, software, incluyendo el motor del Probador Virtual 2D) son de titularidad de FITLOOK o de sus licenciantes y se encuentran protegidos por la Ley sobre el Derecho de Autor (Decreto Legislativo N.° 822) y demás normas de propiedad intelectual aplicables. Queda prohibida su reproducción, distribución o uso comercial sin autorización previa y por escrito.",
    ],
  },
  {
    heading: "Conductas prohibidas",
    paragraphs: [
      "El usuario se compromete a no utilizar la plataforma con fines fraudulentos, a no vulnerar los sistemas de seguridad, a no suplantar la identidad de terceros y a no realizar actividades que infrinjan la normativa peruana vigente, incluyendo la Ley N.° 30096, Ley de Delitos Informáticos.",
    ],
  },
  {
    heading: "Limitación de responsabilidad",
    paragraphs: [
      "FITLOOK no será responsable por fallos ajenos a su control razonable (caso fortuito, fuerza mayor, fallas de conectividad de terceros) ni por el uso indebido que el usuario dé a las sugerencias generadas por el Probador Virtual 2D. Ninguna disposición de estos Términos limita los derechos irrenunciables reconocidos al consumidor por el Código de Protección y Defensa del Consumidor.",
    ],
  },
  {
    heading: "Libro de Reclamaciones",
    paragraphs: [
      "En cumplimiento del artículo 150 del Código de Protección y Defensa del Consumidor y del Decreto Supremo N.° 011-2011-PCM, FITLOOK pone a disposición del usuario un Libro de Reclamaciones Virtual, accesible desde la plataforma, para el registro de quejas y reclamos.",
    ],
  },
  {
    heading: "Modificaciones a los Términos",
    paragraphs: [
      "FITLOOK podrá actualizar estos Términos y Condiciones en cualquier momento. Las modificaciones entrarán en vigencia desde su publicación en la plataforma, indicando la fecha de la última actualización.",
    ],
  },
  {
    heading: "Ley aplicable y jurisdicción",
    paragraphs: [
      "Estos Términos y Condiciones se rigen por las leyes de la República del Perú. Cualquier controversia derivada de su interpretación o cumplimiento podrá someterse, a elección del consumidor, a los mecanismos de solución de conflictos de INDECOPI o a los jueces y tribunales del domicilio del consumidor, conforme a la normativa de protección al consumidor.",
    ],
  },
  {
    heading: "Contacto",
    paragraphs: [
      "Para consultas, reclamos o ejercicio de derechos relacionados con estos Términos y Condiciones, puedes escribirnos a soporte@fitlook.pe o comunicarte al +51 987 654 321.",
    ],
  },
];

const PRIVACY_INTRO =
  "FITLOOK, operada por FITLOOK PERÚ S.A.C., RUC N.° 20609876541, con domicilio en Av. Javier Prado Este 1245, San Isidro, Lima, Perú (en adelante, \"FITLOOK\"), es responsable del tratamiento de los datos personales que recopila a través de su plataforma web, incluido el módulo de Probador Virtual 2D. Esta Política de Privacidad se elabora en cumplimiento de la Ley N.° 29733, Ley de Protección de Datos Personales, su Reglamento aprobado por Decreto Supremo N.° 003-2013-JUS, y las directivas emitidas por la Autoridad Nacional de Protección de Datos Personales del Ministerio de Justicia y Derechos Humanos.";

const PRIVACY_SECTIONS: LegalSection[] = [
  {
    heading: "Datos personales que recopilamos",
    paragraphs: [
      "Datos de identificación y contacto: nombre, apellidos, correo electrónico, número de teléfono, dirección de envío y documento de identidad (DNI o Carné de Extranjería) cuando sea necesario para la facturación.",
      "Datos de cuenta: usuario, contraseña (almacenada de forma cifrada) y preferencias de navegación.",
      "Datos de transacciones: historial de compras, productos favoritos y datos de pago tokenizados por nuestra pasarela de pagos. FITLOOK no almacena el número completo de tarjetas.",
      "Datos del Probador Virtual 2D: medidas corporales, talla habitual y/o fotografías que el usuario decide subir voluntariamente para generar una visualización referencial de las prendas. Estos datos pueden calificar como datos sensibles conforme al artículo 2, numeral 5 de la Ley N.° 29733, por lo que se solicitan bajo consentimiento expreso, previo, informado, inequívoco y libre del usuario.",
      "Datos de navegación: dirección IP, tipo de dispositivo, cookies y datos de uso de la plataforma.",
    ],
  },
  {
    heading: "Finalidad del tratamiento",
    paragraphs: [
      "Utilizamos los datos personales para: (i) gestionar el registro y la cuenta del usuario; (ii) procesar pedidos, pagos y envíos; (iii) generar las sugerencias del Probador Virtual 2D; (iv) brindar atención al cliente y gestionar reclamos a través del Libro de Reclamaciones; (v) enviar comunicaciones comerciales, siempre que el usuario haya otorgado su consentimiento para ello; y (vi) cumplir obligaciones legales, contables y tributarias.",
    ],
  },
  {
    heading: "Base legal y consentimiento",
    paragraphs: [
      "El tratamiento de los datos se sustenta en el consentimiento del titular, otorgado al momento del registro y, de manera diferenciada y expresa, para el tratamiento de datos sensibles asociados al Probador Virtual 2D. El usuario puede retirar su consentimiento en cualquier momento, sin que ello afecte la licitud del tratamiento realizado previamente.",
    ],
  },
  {
    heading: "Plazo de conservación",
    paragraphs: [
      "Los datos personales se conservarán mientras la cuenta del usuario permanezca activa y, posteriormente, durante los plazos exigidos por la normativa tributaria y comercial peruana. Las medidas corporales y fotografías del Probador Virtual 2D se conservan únicamente mientras el usuario mantenga activa dicha funcionalidad, y pueden eliminarse a solicitud del titular en cualquier momento.",
    ],
  },
  {
    heading: "Encargados de tratamiento y terceros",
    paragraphs: [
      "FITLOOK podrá compartir datos personales con proveedores de pasarela de pago, empresas de mensajería o courier y proveedores de hosting/infraestructura tecnológica, quienes actúan como encargados de tratamiento bajo obligaciones contractuales de confidencialidad y seguridad, y únicamente para las finalidades descritas en esta política. FITLOOK no vende ni comercializa datos personales a terceros.",
    ],
  },
  {
    heading: "Transferencia internacional de datos",
    paragraphs: [
      "En caso de que alguno de nuestros proveedores tecnológicos almacene información en servidores ubicados fuera del Perú, dicha transferencia se realizará garantizando un nivel de protección adecuado conforme a lo dispuesto por la Ley N.° 29733 y su Reglamento.",
    ],
  },
  {
    heading: "Derechos ARCO del titular",
    paragraphs: [
      "Conforme a la Ley N.° 29733, el usuario puede ejercer en cualquier momento sus derechos de Acceso, Rectificación, Cancelación y Oposición (derechos ARCO), así como el derecho a la portabilidad de sus datos, enviando una solicitud a privacidad@fitlook.pe, adjuntando copia de su documento de identidad. FITLOOK atenderá la solicitud dentro de los plazos establecidos por la normativa vigente (hasta 20 días hábiles para el derecho de acceso, y 10 días hábiles para rectificación, cancelación u oposición, prorrogables conforme a ley).",
    ],
  },
  {
    heading: "Medidas de seguridad",
    paragraphs: [
      "FITLOOK implementa medidas técnicas, organizativas y legales razonables (cifrado, control de accesos, autenticación en dos factores) para proteger los datos personales contra pérdida, uso indebido, acceso no autorizado o alteración, conforme a la Directiva de Seguridad de la Información aprobada por la Autoridad Nacional de Protección de Datos Personales.",
    ],
  },
  {
    heading: "Uso de cookies",
    paragraphs: [
      "La plataforma utiliza cookies propias y de terceros para mejorar la experiencia de navegación, recordar preferencias y analizar el uso del sitio. El usuario puede configurar su navegador para rechazar cookies, aunque ello podría limitar algunas funcionalidades.",
    ],
  },
  {
    heading: "Menores de edad",
    paragraphs: [
      "FITLOOK no recopila intencionalmente datos personales de menores de 18 años sin el consentimiento verificable de su padre, madre o tutor legal. Si se detecta el tratamiento de datos de un menor sin dicha autorización, FITLOOK procederá a eliminarlos.",
    ],
  },
  {
    heading: "Cambios a esta política",
    paragraphs: [
      "Esta Política de Privacidad podrá actualizarse periódicamente. Cualquier cambio sustancial será comunicado a los usuarios a través de la plataforma o del correo electrónico registrado, indicando la fecha de la última actualización.",
    ],
  },
  {
    heading: "Autoridad de control y reclamos",
    paragraphs: [
      "El usuario que considere vulnerados sus derechos en materia de protección de datos personales puede presentar un reclamo ante la Autoridad Nacional de Protección de Datos Personales del Ministerio de Justicia y Derechos Humanos, o ante INDECOPI en lo relativo a la protección del consumidor.",
    ],
  },
  {
    heading: "Contacto",
    paragraphs: [
      "Para consultas o solicitudes relacionadas con esta Política de Privacidad, puedes escribirnos a privacidad@fitlook.pe.",
    ],
  },
];

const LEGAL_DOCS: Record<LegalDocType, { title: string; intro: string; sections: LegalSection[] }> = {
  terms: { title: "Términos y Condiciones de Uso", intro: TERMS_INTRO, sections: TERMS_SECTIONS },
  privacy: { title: "Política de Privacidad", intro: PRIVACY_INTRO, sections: PRIVACY_SECTIONS },
};

export function LegalModal({
  doc,
  onClose,
  onSwitch,
}: {
  doc: LegalDocType;
  onClose: () => void;
  onSwitch: (doc: LegalDocType) => void;
}) {
  const content = LEGAL_DOCS[doc];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 print:p-0 print:static"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #legal-modal-print, #legal-modal-print * { visibility: visible; }
          #legal-modal-print {
            position: absolute; left: 0; top: 0; width: 100%;
            box-shadow: none !important; border: none !important; max-height: none !important;
          }
          #legal-modal-backdrop, #legal-modal-actions { display: none !important; }
        }
      `}</style>

      <div
        id="legal-modal-backdrop"
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        id="legal-modal-print"
        className="relative w-full max-w-2xl max-h-[85vh] bg-white dark:bg-brand-card-dark rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden"
      >
        <div className="flex items-start justify-between gap-4 px-6 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <p className="text-[10px] font-bold text-brand-green uppercase tracking-widest mb-1">
              FITLOOK
            </p>
            <h2
              id="legal-modal-title"
              className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight"
            >
              {content.title}
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">
              Última actualización: {LEGAL_LAST_UPDATED}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div id="legal-modal-actions" className="flex gap-2 px-6 sm:px-8 pt-4">
          <button
            type="button"
            onClick={() => onSwitch("terms")}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors ${
              doc === "terms"
                ? "bg-brand-green text-black"
                : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300"
            }`}
          >
            Términos
          </button>
          <button
            type="button"
            onClick={() => onSwitch("privacy")}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors ${
              doc === "privacy"
                ? "bg-brand-green text-black"
                : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300"
            }`}
          >
            Privacidad
          </button>
        </div>

        <div className="overflow-y-auto px-6 sm:px-8 py-6 space-y-6">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{content.intro}</p>
          {content.sections.map((section, index) => (
            <div key={section.heading}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                {index + 1}. {section.heading}
              </h3>
              <div className="space-y-1.5">
                {section.paragraphs.map((paragraph, pIndex) => (
                  <p key={pIndex} className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          id="legal-modal-actions"
          className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-slate-700"
        >
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <i className="fa-solid fa-print" />
            Imprimir
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-black bg-brand-green rounded-lg hover:bg-brand-green-hover transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

function DarkPanel() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center text-center px-10">
      <Link to="/" className="mb-8">
        <span className="text-3xl font-extrabold tracking-tight text-white">
          FIT<span className="text-brand-green">LOOK</span>
        </span>
        <span className="block bg-brand-input-dark text-[10px] font-bold text-brand-green px-3 py-1 rounded border border-brand-input-border-dark tracking-wider mt-2 w-fit mx-auto">
          AR FIT
        </span>
      </Link>
      <h2 className="text-3xl 2xl:text-4xl font-extrabold text-white mb-4">
        Bienvenido de vuelta
      </h2>
      <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
        Inicia sesión para acceder a tu armario virtual, sincroniza tus medidas
        AR y gestionar tus pedidos.
      </p>
      <div className="mt-10 grid grid-cols-3 gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-brand-green/10 flex items-center justify-center">
            <i className="fa-solid fa-cube text-brand-green text-lg" />
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            Probador 2D
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-brand-green/10 flex items-center justify-center">
            <i className="fa-solid fa-ruler-vertical text-brand-green text-lg" />
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            Medidas AR
          </span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-brand-green/10 flex items-center justify-center">
            <i className="fa-solid fa-truck-fast text-brand-green text-lg" />
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            Envío rápido
          </span>
        </div>
      </div>
    </div>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [legalDoc, setLegalDoc] = useState<LegalDocType | null>(null);

  return (
    <div className="min-h-screen bg-brand-light-bg dark:bg-brand-dark-bg flex">
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] bg-brand-dark-bg flex-col justify-between p-10 2xl:p-14">
        <div className="flex items-start justify-start">
          <ThemeToggle />
        </div>
        <DarkPanel />
        <div className="text-[10px] text-slate-600 flex items-center gap-3">
          <span>&copy; 2026 FITLOOK Athletics</span>
          <button
            type="button"
            onClick={() => setLegalDoc("terms")}
            className="underline decoration-slate-700 hover:text-brand-green hover:decoration-brand-green transition-colors"
          >
            Términos
          </button>
          <button
            type="button"
            onClick={() => setLegalDoc("privacy")}
            className="underline decoration-slate-700 hover:text-brand-green hover:decoration-brand-green transition-colors"
          >
            Privacidad
          </button>
        </div>
      </div>

      <div className="w-full lg:w-1/2 xl:w-[45%] bg-white dark:bg-brand-card-dark flex flex-col items-center justify-center px-6 py-12 relative">
        <div className="absolute top-5 right-5 lg:hidden">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>

      {legalDoc && (
        <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} onSwitch={setLegalDoc} />
      )}
    </div>
  );
}
