// Contenu du site public.
// Phase 7 : ces données seront éditables depuis l'admin (tables site_content, services,
// projects, references). Les pages lisent uniquement via src/lib/content.ts, si bien que
// seul ce module changera de source.

import type { IconName } from "@/components/icons";

export const company = {
  displayName: "Électricité N.A.B.",
  legalName: "NAB (NAB ELECTRICITE)",
  legalForm: "EURL (société à responsabilité limitée unipersonnelle)",
  siret: "929 330 249 00012",
  siren: "929 330 249",
  vatNumber: "FR75 929 330 249",
  nafCode: "43.21A — Travaux d'installation électrique dans tous locaux",
  headOffice: "25 rue Raymond Lavigne, appartement 401, 33100 Bordeaux",
  city: "Bordeaux",
  phone: "06 66 61 43 73",
  phoneHref: "tel:+33666614373",
  phoneIntl: "+33666614373",
  email: "infos.eurlnab@gmail.com",
  serviceArea: "Nouvelle-Aquitaine",
  // Champs à compléter (affichés « à compléter » tant qu'ils sont vides)
  shareCapital: null as string | null,
  publicationDirector: null as string | null,
  insurer: null as string | null,
  insuranceCoverage: null as string | null,
};

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://nabelec.fr").replace(/\/$/, "");

export const mainNav = [
  { href: "/", label: "Accueil" },
  { href: "/a-propos", label: "À propos" },
  { href: "/prestations", label: "Prestations" },
  { href: "/realisations", label: "Réalisations" },
  { href: "/contact", label: "Contact" },
] as const;

export type Audience = "particulier" | "professionnel" | "tous";

export type Service = {
  slug: string;
  icon: IconName;
  title: string;
  shortTitle: string;
  summary: string;
  intro: string;
  includes: string[];
  forWho: string;
  audience: Audience;
  image?: string;
  faq: { q: string; a: string }[];
};

export const services: Service[] = [
  {
    slug: "installation-electrique-neuve",
    icon: "home",
    title: "Installation électrique neuve",
    shortTitle: "Installation neuve",
    summary: "Toute l'installation électrique d'un logement ou d'un local neuf, du tableau aux prises.",
    intro:
      "Pour une construction neuve ou une extension, nous réalisons l'installation électrique complète, conformément à la norme NF C 15-100 : tableau, circuits, prises, éclairage et équipements.",
    includes: [
      "Étude des besoins et implantation des points électriques",
      "Pose du tableau électrique et des protections",
      "Passage des gaines et câblage des circuits",
      "Prises, interrupteurs, éclairage",
      "Mise en service de l'installation",
    ],
    forWho: "Maisons, appartements, commerces et bureaux neufs ou en extension.",
    audience: "tous",
    image: "/images/realisations/charpente-chantier.jpg",
    faq: [
      {
        q: "À quel moment du chantier intervenez-vous ?",
        a: "En général une première fois avant la pose des cloisons et des doublages pour passer les gaines, puis en fin de chantier pour l'appareillage et la mise en service.",
      },
    ],
  },
  {
    slug: "renovation-electrique",
    icon: "refresh",
    title: "Rénovation électrique",
    shortTitle: "Rénovation",
    summary: "Remise à neuf partielle ou complète d'une installation ancienne.",
    intro:
      "Une installation ancienne peut devenir insuffisante ou dangereuse. Nous rénovons tout ou partie de votre installation, pièce par pièce ou en une seule fois, en limitant la gêne au quotidien.",
    includes: [
      "Diagnostic de l'installation existante",
      "Remplacement des circuits et des appareillages vétustes",
      "Ajout de prises et de circuits spécialisés",
      "Remplacement du tableau si nécessaire",
    ],
    forWho: "Logements anciens, achats immobiliers, commerces à rénover.",
    audience: "tous",
    image: "/images/realisations/maison-neuve.jpg",
    faq: [
      {
        q: "Peut-on rénover sans tout casser ?",
        a: "Souvent oui : selon les cas, les nouveaux câbles peuvent passer dans les gaines existantes, en goulottes ou en plinthes. Nous vous proposons la solution adaptée après visite.",
      },
    ],
  },
  {
    slug: "mise-aux-normes-nf-c-15-100",
    icon: "shield",
    title: "Mise aux normes NF C 15-100",
    shortTitle: "Mise aux normes",
    summary: "Mise en conformité d'une installation avec la norme électrique en vigueur.",
    intro:
      "La norme NF C 15-100 fixe les règles de sécurité des installations électriques basse tension. Nous identifions les points non conformes et réalisons les travaux de mise aux normes.",
    includes: [
      "Vérification de la mise à la terre et des liaisons équipotentielles",
      "Protection différentielle 30 mA",
      "Adaptation des circuits et des sections de câbles",
      "Mise en sécurité des pièces d'eau",
    ],
    forWho: "Vente ou location d'un bien, installation ancienne, demande de l'assureur.",
    audience: "tous",
    image: "/images/realisations/coffret-compteurs.jpg",
    faq: [
      {
        q: "Est-ce obligatoire de mettre mon logement aux normes ?",
        a: "Une installation existante n'a pas toujours à être entièrement refaite, mais elle doit rester sûre. Un diagnostic permet de savoir quels travaux sont nécessaires.",
      },
    ],
  },
  {
    slug: "tableau-electrique",
    icon: "panel",
    title: "Remplacement de tableau électrique",
    shortTitle: "Tableau électrique",
    summary: "Remplacement d'un tableau ancien, saturé ou défaillant.",
    intro:
      "Le tableau électrique protège toute l'installation. Un tableau ancien, qui disjoncte souvent ou qui n'a plus de place, doit être remplacé par un tableau adapté à vos besoins actuels.",
    includes: [
      "Dépose de l'ancien tableau",
      "Pose d'un tableau neuf avec disjoncteurs et interrupteurs différentiels",
      "Repérage clair de chaque circuit",
      "Contrôle et remise sous tension",
    ],
    forWho: "Particuliers et professionnels.",
    audience: "tous",
    image: "/images/realisations/coffret-compteurs.jpg",
    faq: [
      {
        q: "Combien de temps dure le remplacement d'un tableau ?",
        a: "Cela dépend de la taille de l'installation. La durée de coupure vous est indiquée à l'avance, lors du devis.",
      },
    ],
  },
  {
    slug: "depannage-electrique",
    icon: "bolt",
    title: "Dépannage électrique 7j/7",
    shortTitle: "Dépannage 7j/7",
    summary: "Panne, coupure, disjoncteur qui saute : intervention 7j/7, soir et week-end compris.",
    intro:
      "Une panne électrique n'attend pas. Nous intervenons 7 jours sur 7, y compris le soir et le week-end, pour rechercher la panne et remettre votre installation en sécurité.",
    includes: [
      "Recherche de panne",
      "Mise en sécurité",
      "Réparation ou remplacement de l'élément défectueux",
      "Conseils pour éviter que la panne se reproduise",
    ],
    forWho: "Particuliers, commerces et entreprises.",
    audience: "tous",
    faq: [
      {
        q: "Sous quel délai pouvez-vous intervenir ?",
        a: "Le délai dépend de la demande et de nos disponibilités du moment. Appelez-nous : nous vous indiquons tout de suite quand nous pouvons passer.",
      },
    ],
  },
  {
    slug: "videosurveillance",
    icon: "camera",
    title: "Vidéosurveillance",
    shortTitle: "Vidéosurveillance",
    summary: "Installation de caméras pour protéger un logement, un commerce ou des bureaux.",
    intro:
      "Nous installons des systèmes de vidéosurveillance adaptés à votre lieu : choix et pose des caméras, enregistreur, alimentation et raccordement.",
    includes: [
      "Choix des emplacements et des caméras",
      "Câblage et alimentation",
      "Installation de l'enregistreur",
      "Mise en service et prise en main",
    ],
    forWho: "Maisons, commerces, bureaux et locaux d'entreprise.",
    audience: "tous",
    faq: [
      {
        q: "Peut-on filmer la rue ou les salariés ?",
        a: "La vidéosurveillance est encadrée par la loi : on ne filme pas la voie publique et l'information des personnes est obligatoire. Nous en tenons compte dans l'implantation des caméras.",
      },
    ],
  },
  {
    slug: "interphonie",
    icon: "intercom",
    title: "Interphonie et visiophonie",
    shortTitle: "Interphonie",
    summary: "Interphones et visiophones pour maisons, immeubles et locaux professionnels.",
    intro:
      "Nous installons ou remplaçons interphones et visiophones, avec ou sans commande de gâche ou de portail.",
    includes: [
      "Pose de la platine de rue et des combinés",
      "Raccordement à la gâche ou au portail",
      "Remplacement d'un ancien système",
    ],
    forWho: "Maisons, petits immeubles, commerces et bureaux.",
    audience: "tous",
    faq: [],
  },
  {
    slug: "vmc",
    icon: "fan",
    title: "VMC — ventilation mécanique contrôlée",
    shortTitle: "VMC",
    summary: "Installation et remplacement de VMC pour un air sain.",
    intro:
      "Une bonne ventilation évite l'humidité et améliore la qualité de l'air. Nous installons et remplaçons les VMC et leurs raccordements électriques.",
    includes: [
      "Pose du caisson de VMC",
      "Bouches d'extraction dans les pièces d'eau",
      "Raccordement électrique",
      "Remplacement d'une VMC défaillante",
    ],
    forWho: "Maisons, appartements et locaux.",
    audience: "tous",
    faq: [],
  },
];

export type Realisation = {
  src: string; // photo, ou image d'aperçu quand il s'agit d'une vidéo
  video?: string;
  focus?: string; // cadrage de la photo, ex. "50% 30%"
  alt: string;
  caption: string;
  service?: string; // slug de la prestation liée
};

// Photos de chantiers de l'entreprise. Légendes descriptives, sans nom de client ni ville.
export const realisations: Realisation[] = [
  {
    src: "/videos/debrief-fin-de-chantier.jpg",
    video: "/videos/debrief-fin-de-chantier.mp4",
    alt: "Vidéo de visite d'un chantier terminé : immeuble rénové, logements et équipements électriques",
    caption: "Débrief de fin de chantier (vidéo)",
  },
  {
    src: "/images/realisations/armoire-electrique.jpg",
    alt: "Électricien devant une armoire de distribution électrique ouverte",
    caption: "Armoire de distribution électrique",
    focus: "50% 30%",
  },
  {
    src: "/images/realisations/boutique-spots.jpg",
    alt: "Électricien sur un escabeau posant des spots encastrés au plafond d'une boutique",
    caption: "Pose de spots encastrés en boutique",
    focus: "50% 38%",
  },
  { src: "/images/realisations/restaurant-bar.jpg", alt: "Bar d'un restaurant éclairé par des néons et des plafonniers", caption: "Éclairage d'un restaurant" },
  { src: "/images/realisations/showroom-plans.jpg", alt: "Showroom de cuisines équipé de spots sur rail", caption: "Éclairage d'un showroom" },
  { src: "/images/realisations/bureau-panneau-led.jpg", alt: "Bureau équipé d'un panneau LED au plafond", caption: "Panneau LED dans un bureau" },
  { src: "/images/realisations/commerce-mur-bois.jpg", alt: "Commerce en fin de chantier avec spots sur rail et réglettes LED", caption: "Spots et réglettes LED en commerce" },
  { src: "/images/realisations/showroom-cuisine.jpg", alt: "Showroom de cuisines éclairé par des spots sur rail", caption: "Spots sur rail en showroom" },
  { src: "/images/realisations/restaurant-neons.jpg", alt: "Néons de couleur au plafond d'un restaurant", caption: "Néons de couleur en restaurant" },
  { src: "/images/realisations/coffret-compteurs.jpg", alt: "Coffrets de comptage installés et repérés dans une gaine technique", caption: "Coffrets de comptage", service: "tableau-electrique" },
  { src: "/images/realisations/charpente-chantier.jpg", alt: "Câblage d'une construction à ossature bois en cours de chantier", caption: "Câblage d'une construction neuve", service: "installation-electrique-neuve" },
  { src: "/images/realisations/maison-neuve.jpg", alt: "Maison neuve en fin de chantier", caption: "Installation d'une maison neuve", service: "installation-electrique-neuve" },
];

// Enseignes pour lesquelles l'entreprise est intervenue. Texte seul : aucun logo sans autorisation écrite.
export const references = ["Pitaya", "Maxi Coffee", "Stokomani"];

export const departments = [
  { name: "Gironde", code: "33" },
  { name: "Charente", code: "16" },
  { name: "Charente-Maritime", code: "17" },
  { name: "Corrèze", code: "19" },
  { name: "Creuse", code: "23" },
  { name: "Dordogne", code: "24" },
  { name: "Landes", code: "40" },
  { name: "Lot-et-Garonne", code: "47" },
  { name: "Pyrénées-Atlantiques", code: "64" },
  { name: "Deux-Sèvres", code: "79" },
  { name: "Vienne", code: "86" },
  { name: "Haute-Vienne", code: "87" },
];
