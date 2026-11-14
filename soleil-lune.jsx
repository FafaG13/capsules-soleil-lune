// Soleil & Lune : hauteur du Soleil et de la Lune sur une fenêtre glissante qui part de maintenant,
// encadrée d'un peu de passé et d'avenir qui s'effacent en fondu sur les bords.
// Tout se passe ici, en JavaScript : positions des astres (formules de SunCalc) et marées (Open-Meteo Marine).
// Le code suit 4 couches : réglages → astronomie → mise en page → dessin.

// ==========================================================================
// 1. MES RÉGLAGES : n'écrire ici que ce qu'on veut changer
// ==========================================================================
// Les valeurs par défaut complètes sont dans DEFAUTS, juste en dessous.
// Une clé absente, mal écrite ou d'un mauvais type garde sa valeur par défaut.
// Exemple : const MES_REGLAGES = { soleil: { epaisseur: 3 }, maintenant: { afficher_heure: false } };
const MES_REGLAGES = {
	general: {
		largeur: 588,          // bord droit aligné sur le système solaire (1450 à l écran)
	},
	fenetre: {
		heures: 72,
	},
	fondus: {
		passe_heures: 6,              // brume du passé, avant le point « maintenant »
		futur_heures: 6,              // brume de l'avenir, après la fenêtre
	},
	horizon: {
		epaisseur: 2.4,
		auto: true,                   // l'horizon bouge, pas les courbes : les heures restent en place toute l'année
		bande_haut: 44,               // sous les heures du Soleil (ligne de base 116 − 80 = 36)
		bande_bas: 192,               // au-dessus des heures de la Lune (ligne de base 116 + 90 = 206)
	},
	soleil: {
		couleur_dessous: '#F8F8F2',   // même blanc sous l'horizon : courbe uniforme
		epaisseur: 2.2,
	},
	lune: { 
		couleur: '#75715E',
		couleur_dessous: '#75715E', },   // même gris au-dessus et en dessous de l'horizon
	heures: {
		couleur_lune: '#75715E',
		taille_soleil: 12,
		taille_lune: 12,
		ecart_soleil: -80,           // heures du Soleil en bandeau, tout en haut
		ecart_lune: 90,              // heures de la Lune tout en bas
		rayon_point_soleil: 3.6,
		rayon_point_lune: 3,        // pastilles de la Lune aussi grandes que celles du Soleil
	},
	minuits: {
		epaisseur: 2,
		taille_jour: 0,               // noms des jours masqués
		haut: 97.5,                   // pointillés courts, autour de l'horizon
		bas: 142.5,
	},
	marees: { afficher: false },
	maintenant: {
		rayon: 3,
		afficher_heure: false,
	},
};

// Réglages personnels (position sur l'écran, ville) : ils passent par-dessus MES_REGLAGES.
// Vide dans la version publiée sur fafag.fr : l'outil de publication retire ce qui est entre les deux repères.
const PERSO = {
};

// ==========================================================================
// 2. VALEURS PAR DÉFAUT (la maquette validée du 3 novembre 2026)
// ==========================================================================
// Les longueurs sont en points ; les hauteurs des astres en degrés.
const DEFAUTS = {
	general: {
		top: 20,                      // position en points depuis le coin haut gauche du bureau
		left: 20,
		largeur: 880,
		hauteur: 300,
		rafraichissement: 60,         // en secondes
		police: '"SF Pro Rounded", ui-rounded, system-ui, sans-serif',
	},
	lieu: {
		latitude: 48.8566,            // Paris ; en degrés nord
		longitude: 2.3522,            // en degrés est
	},
	fenetre: {
		heures: 72,                   // durée affichée à partir de maintenant (hors fondus)
		pas: 10,                      // finesse des courbes, en minutes
		marge_gauche: 24,
		marge_droite: 16,
	},
	fondus: {
		afficher: true,               // un peu de passé à gauche et d'avenir à droite, qui s'effacent dans le fond
		passe_heures: 3,              // brume du passé, avant le point « maintenant »
		futur_heures: 3,              // brume de l'avenir, après la fenêtre
	},
	horizon: {
		y: 116,                       // hauteur de la ligne d'horizon dans le widget ; en mode auto, ligne de référence des heures
		couleur: '#3B3A32',
		epaisseur: 1.5,
		echelle: 1.05,                // points par degré de hauteur
		auto: false,                  // true : l'horizon se place tout seul pour que les courbes tiennent dans la bande ci-dessous
		bande_haut: 30,               // en mode auto : haut et bas de la bande réservée aux courbes (phases de Lune comprises)
		bande_bas: 200,
		serrer: true,                 // en mode auto, les jours où les courbes ne tiennent pas (Lune très haute en hiver) : échelle resserrée juste ce qu'il faut
	},
	soleil: {
		afficher: true,
		couleur: '#F8F8F2',           // au-dessus de l'horizon
		couleur_dessous: '#75715E',   // sous l'horizon (jusqu'au nadir)
		epaisseur: 2.4,
	},
	lune: {
		afficher: true,
		couleur: '#75715E',
		couleur_dessous: '#49483E',
		epaisseur: 1.8,
	},
	heures: {
		afficher_soleil: true,        // heures de lever et de coucher du Soleil, sous l'horizon
		afficher_lune: true,          // heures de lever et de coucher de la Lune, en dessous
		couleur_soleil: '#F8F8F2',
		couleur_lune: '#75715E',
		taille_soleil: 13,
		taille_lune: 12,
		ecart_soleil: 21,             // sous l'horizon, en points (ligne de base du texte) ; négatif = au-dessus
		ecart_lune: 37,
		rayon_point_soleil: 2.6,      // petit point posé sur l'horizon au lever et au coucher (0 = aucun)
		rayon_point_lune: 2.2,
		hauteur_lever_soleil: -0.833, // hauteur officielle du lever et du coucher (réfraction comprise)
		hauteur_lever_lune: 0.133,
	},
	phase: {
		afficher: true,               // phase de la Lune au sommet de chacun de ses arcs
		rayon: 7,
		ecart: 16,                    // au-dessus du sommet de l'arc
		couleur_ombre: '#3B3A32',
		couleur_lumiere: '#F8F8F0',
		afficher_texte: true,         // pourcentage éclairé et flèche (↗ croissante, ↘ décroissante)
		couleur_texte: '#75715E',
		taille_texte: 12,
	},
	minuits: {
		afficher: true,               // trait pointillé à chaque minuit, avec le jour qui commence
		couleur: '#3B3A32',
		epaisseur: 1,
		tirets: '2 5',
		haut: 30,                     // étendue verticale du trait, depuis le haut du widget
		bas: 282,
		couleur_jour: '#75715E',
		taille_jour: 13,
		noms: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
	},
	marees: {
		afficher: true,               // hauteur de la mer heure par heure (Open-Meteo Marine), pour le lieu réglé plus haut
		cache_minutes: 180,           // une nouvelle prévision au plus toutes les 3 heures
		y: 246,                       // milieu de la bande des marées
		demi_hauteur: 10,             // hauteur FIXE d'affichage, quel que soit le marnage réel
		couleur: '#49483E',
		epaisseur: 1.4,
		tirets: '1 4',                // '' = trait plein
		largeur_pilule: 18,
		hauteur_pilule: 7,
		ecart_pilule: 2,              // entre la courbe et la pilule
		couleur_pleine: '#F8F8F2',    // pilule de pleine mer (au-dessus de la courbe)
		couleur_basse: '#49483E',     // pilule de basse mer (en dessous)
		afficher_heures: true,
		afficher_hauteurs: false,     // hauteur en mètres après l'heure (ex. 16h30 · −0,23 m)
		couleur_texte: '#75715E',
		taille_texte: 11.5,
		ecart_texte_pleine: 9,        // au-dessus de la pilule de pleine mer
		ecart_texte_basse: 14,        // en dessous de la pilule de basse mer
	},
	maintenant: {
		couleur: '#F92672',           // la seule touche de rose
		rayon: 4.5,
		afficher_heure: true,
		taille_heure: 13,
		ecart_heure: 12,              // entre le point et son heure, au-dessus
	},
	saison: {
		afficher: true,               // petite aiguille au bout de l'horizon : le point monte vers l'été, descend vers l'hiver
		ecart: 22,                    // distance entre le bout de l'horizon et l'aiguille
		demi_hauteur: 22,             // demi-longueur du trait (du centre à « été »)
		couleur: '#3B3A32',           // le trait et sa petite coche au niveau de l'horizon
		epaisseur: 2,
		largeur_coche: 6,             // 0 : pas de coche
		couleur_point: '#F8F8F2',
		rayon_point: 3,
		mots: true,                   // « été » en haut, « hiver » en bas
		couleur_mots: '#49483E',
		taille_mots: 11,
		ecart_mots: 9,
	},
};

// Fusion tolérante : chaque valeur de MES_REGLAGES remplace celle de DEFAUTS si son type convient.
const fusionner = (defaut, perso) => {
	if (Array.isArray(defaut)) {
		if (!Array.isArray(perso)) return defaut;
		return perso.map((p, i) => fusionner(defaut[Math.min(i, defaut.length - 1)], p));
	}
	if (defaut && typeof defaut === 'object') {
		const resultat = {};
		const source = perso && typeof perso === 'object' ? perso : {};
		for (const cle of Object.keys(defaut)) resultat[cle] = fusionner(defaut[cle], source[cle]);
		return resultat;
	}
	const typeAccepte = typeof perso === typeof defaut || (typeof defaut === 'string' && typeof perso === 'number');
	return perso !== undefined && typeAccepte ? perso : defaut;
};

const R = fusionner(fusionner(DEFAUTS, MES_REGLAGES), PERSO);

// ==========================================================================
// 3. ASTRONOMIE : une date donne une hauteur (fonctions pures, formules de SunCalc)
// ==========================================================================
const RAD = Math.PI / 180;
const OBLIQUITE = RAD * 23.4397;
const jours = t => t / 86400000 - 0.5 + 2440588 - 2451545;      // jours depuis le 1er janvier 2000 à midi

// Hauteur (en radians) d'un astre de déclinaison dec et d'ascension droite ra, au jour d, pour le lieu réglé
const hauteurAstre = (dec, ra, d) => {
	const H = RAD * (280.16 + 360.9856235 * d) + RAD * R.lieu.longitude - ra;   // angle horaire
	const phi = RAD * R.lieu.latitude;
	return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
};

const coordSoleil = d => {
	const M = RAD * (357.5291 + 0.98560028 * d);
	const L = M + RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) + RAD * 102.9372 + Math.PI;
	return { dec: Math.asin(Math.sin(OBLIQUITE) * Math.sin(L)), ra: Math.atan2(Math.sin(L) * Math.cos(OBLIQUITE), Math.cos(L)) };
};

const coordLune = d => {
	const L = RAD * (218.316 + 13.176396 * d), M = RAD * (134.963 + 13.064993 * d), F = RAD * (93.272 + 13.229350 * d);
	const l = L + RAD * 6.289 * Math.sin(M), b = RAD * 5.128 * Math.sin(F);
	return {
		dec: Math.asin(Math.sin(b) * Math.cos(OBLIQUITE) + Math.cos(b) * Math.sin(OBLIQUITE) * Math.sin(l)),
		ra: Math.atan2(Math.sin(l) * Math.cos(OBLIQUITE) - Math.tan(b) * Math.sin(OBLIQUITE), Math.cos(l)),
		distance: 385001 - 20905 * Math.cos(M),
	};
};

// Fraction éclairée de la Lune et sens de la phase (croissante avant la pleine lune)
const phaseLune = t => {
	const d = jours(t), s = coordSoleil(d), l = coordLune(d), distanceSoleil = 149598000;
	const phi = Math.acos(Math.sin(s.dec) * Math.sin(l.dec) + Math.cos(s.dec) * Math.cos(l.dec) * Math.cos(s.ra - l.ra));
	const inc = Math.atan2(distanceSoleil * Math.sin(phi), l.distance - distanceSoleil * Math.cos(phi));
	const angle = Math.atan2(Math.cos(s.dec) * Math.sin(s.ra - l.ra),
		Math.sin(s.dec) * Math.cos(l.dec) - Math.cos(s.dec) * Math.sin(l.dec) * Math.cos(s.ra - l.ra));
	return { eclairee: (1 + Math.cos(inc)) / 2, croissante: angle < 0 };
};

const hauteurSoleil = t => { const d = jours(t), c = coordSoleil(d); return hauteurAstre(c.dec, c.ra, d) / RAD; };
const hauteurLune = t => { const d = jours(t), c = coordLune(d); return hauteurAstre(c.dec, c.ra, d) / RAD; };

// ==========================================================================
// 4. MISE EN PAGE : un instant et une hauteur donnent un point du widget
// ==========================================================================
const G = R.general, F = R.fenetre, Hz = R.horizon;
const FO = R.fondus;
const AVANT = FO.afficher ? Math.max(0, FO.passe_heures) * 3600000 : 0;    // passé dessiné à gauche de maintenant
const APRES = FO.afficher ? Math.max(0, FO.futur_heures) * 3600000 : 0;    // avenir dessiné après la fenêtre
const DUREE = AVANT + F.heures * 3600000 + APRES;                         // toute la ligne de temps dessinée
const pad = n => String(n).padStart(2, '0');
const xDe = (t, debut) => F.marge_gauche + (t - debut) / DUREE * (G.largeur - F.marge_gauche - F.marge_droite);
// Position courante de l'horizon : Hz.y, ou calculée à chaque dessin en mode auto (voir placerHorizon)
let yHorizon = Hz.y, echelle = Hz.echelle;      // l'échelle ne change que si horizon.serrer doit intervenir
const yDe = hauteur => yHorizon - hauteur * echelle;

// Courbe d'un astre découpée à chaque passage de l'horizon : [{ dessus, points: [[x, y]…] }…]
// Le point de passage est calculé exactement, pour que les deux couleurs se touchent sur l'horizon.
const morceaux = (hauteur, debut) => {
	const pas = F.pas * 60000, liste = [];
	let courant = null, precedent = null;
	for (let t = debut; t <= debut + DUREE + 1; t += pas) {
		const h = hauteur(t), point = [xDe(t, debut), yDe(h)], dessus = h >= 0;
		if (precedent && (precedent.h >= 0) !== dessus) {
			const f = precedent.h / (precedent.h - h), tx = precedent.t + f * pas;
			const passage = [xDe(tx, debut), yHorizon];
			courant.points.push(passage);
			courant = { dessus, points: [passage] };
			liste.push(courant);
		}
		if (!courant) { courant = { dessus, points: [] }; liste.push(courant); }
		courant.points.push(point);
		precedent = { t, h };
	}
	return liste;
};

// Mode auto : l'horizon descend quand les astres montent (été, Lune haute) et remonte quand ils descendent,
// pour que les courbes restent centrées dans la bande ; l'échelle ne change pas, les courbes gardent leur taille.
const placerHorizon = debut => {
	const pas = F.pas * 60000, P = R.phase;
	let soleilHaut = -90, luneHaut = -90, bas = 90;      // en degrés, sur toute la ligne de temps dessinée
	for (let t = debut; t <= debut + DUREE; t += pas) {
		if (R.soleil.afficher) { const h = hauteurSoleil(t); soleilHaut = Math.max(soleilHaut, h); bas = Math.min(bas, h); }
		if (R.lune.afficher) { const h = hauteurLune(t); luneHaut = Math.max(luneHaut, h); bas = Math.min(bas, h); }
	}
	const icone = P.afficher && luneHaut > 0 ? P.ecart + P.rayon : 0;   // la petite Lune posée au-dessus du sommet
	const bande = Hz.bande_bas - Hz.bande_haut;
	let e = Hz.echelle;
	if (Hz.serrer) {                                     // plus grande échelle qui fait tout tenir dans la bande
		if (soleilHaut > bas) e = Math.min(e, bande / (soleilHaut - bas));
		if (luneHaut > bas) e = Math.min(e, (bande - icone) / (luneHaut - bas));
	}
	const dessus = Math.max(0, soleilHaut * e, luneHaut * e + icone), dessous = Math.max(0, -bas * e);
	return { y: Hz.bande_haut + dessus + (bande - dessus - dessous) / 2, e };
};

// Instants où un astre passe une hauteur h0 (lever : montant, coucher : descendant), à la minute près
const passages = (hauteur, h0, debut) => {
	const pas = 5 * 60000, liste = [];
	let t0 = debut, h1 = hauteur(debut) - h0;
	for (let t = debut + pas; t <= debut + DUREE; t += pas) {
		const h2 = hauteur(t) - h0;
		if ((h1 < 0) !== (h2 < 0)) liste.push({ t: t0 + h1 / (h1 - h2) * pas, lever: h2 > h1 });
		t0 = t; h1 = h2;
	}
	return liste;
};

// Sommets des arcs au-dessus de l'horizon (jamais sur les bords : un arc coupé par la fenêtre n'a pas de sommet)
const sommets = (hauteur, debut) => {
	const pas = F.pas * 60000, liste = [];
	for (let t = debut + pas; t < debut + DUREE - pas; t += pas) {
		const a = hauteur(t - pas), b = hauteur(t), c = hauteur(t + pas);
		if (b > 0 && b > a && b >= c) liste.push({ t, hauteur: b });
	}
	return liste;
};

// Minuits (heure locale) compris dans la fenêtre
const minuits = debut => {
	const liste = [], d = new Date(debut);
	d.setHours(24, 0, 0, 0);
	for (; d.getTime() < debut + DUREE; d.setDate(d.getDate() + 1)) liste.push(new Date(d));
	return liste;
};

const heureTexte = t => { const d = new Date(t); return `${pad(d.getHours())}h${pad(d.getMinutes())}`; };

// Disque de la Lune éclairé selon sa phase : moitié éclairée à droite si croissante, à gauche si décroissante ;
// le terminateur est une demi-ellipse qui bombe vers la lumière pour un croissant, vers l'ombre pour une gibbeuse.
const cheminPhase = (x, y, r, eclairee, croissante) => {
	const kx = Math.abs(r * (1 - 2 * eclairee)), bord = croissante ? 1 : 0;
	const retour = eclairee < 0.5 ? 1 - bord : bord;
	return `M${x} ${y - r}A${r} ${r} 0 0 ${bord} ${x} ${y + r}A${kx.toFixed(2)} ${r} 0 0 ${retour} ${x} ${y - r}Z`;
};

// Marées : le JSON d'Open-Meteo Marine, heures en temps universel (timezone=GMT, d'où le « Z »).
// Renvoie les mesures horaires [{ t, h }] ; des données illisibles donnent une liste vide (pas de marées dessinées).
const lireMarees = json => {
	try {
		const temps = json.hourly.time, hauteurs = json.hourly.sea_level_height_msl;
		return temps.map((x, i) => ({ t: new Date(`${x}Z`).getTime(), h: hauteurs[i] })).filter(m => typeof m.h === 'number' && !isNaN(m.t));
	} catch (e) { return []; }
};

// Pleines et basses mers : sommet de la parabole passant par trois mesures horaires voisines
const extremesMarees = mesures => {
	const liste = [];
	for (let i = 1; i < mesures.length - 1; i++) {
		const [a, b, c] = [mesures[i - 1].h, mesures[i].h, mesures[i + 1].h];
		const pleine = b > a && b >= c, basse = b < a && b <= c;
		if (!pleine && !basse) continue;
		const den = a - 2 * b + c, decalage = den ? 0.5 * (a - c) / den : 0;
		liste.push({ t: mesures[i].t + decalage * 3600000, h: b, pleine });
	}
	return liste;
};

// Courbe lissée : segments quadratiques qui passent par le milieu de chaque intervalle
const cheminLisse = points => {
	if (points.length < 3) return chemin(points);
	const mi = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], f = p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
	let d = `M${f(points[0])}L${f(mi(points[0], points[1]))}`;
	for (let i = 1; i < points.length - 1; i++) d += `Q${f(points[i])} ${f(mi(points[i], points[i + 1]))}`;
	return d + `L${f(points[points.length - 1])}`;
};

const chemin = points => points.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('');

// ==========================================================================
// 5. ÜBERSICHT : rafraîchissement et dessin
// ==========================================================================
// À chaque rafraîchissement, le widget se redessine (les astres bougent) ; les marées sont téléchargées
// seulement si le cache a plus de marees.cache_minutes ou ne couvre plus toute la ligne de temps.
// Le cache survit au redémarrage d'Übersicht (localStorage) ; si le réseau tombe, l'ancienne prévision reste.
// Marées masquées (marees.afficher = false) : aucun téléchargement.
const CLE_MAREES = 'capsules-soleil-lune-marees';
const LIEU_MAREES = `${R.lieu.latitude},${R.lieu.longitude}`;
const JOURS_MAREES = Math.min(8, Math.ceil((F.heures * 3600000 + APRES) / 86400000) + 1);   // de quoi couvrir toute la ligne de temps
const URL_MAREES = `https://marine-api.open-meteo.com/v1/marine?latitude=${R.lieu.latitude}&longitude=${R.lieu.longitude}`
	+ `&hourly=sea_level_height_msl&timezone=GMT&past_days=1&forecast_days=${JOURS_MAREES}`;

const lireCacheMarees = () => {
	try { const c = JSON.parse(localStorage.getItem(CLE_MAREES)); return c && c.lieu === LIEU_MAREES && c.donnees ? c : null; }
	catch (e) { return null; }
};
const ecrireCacheMarees = donnees => {
	try { localStorage.setItem(CLE_MAREES, JSON.stringify({ lieu: LIEU_MAREES, quand: Date.now(), donnees })); } catch (e) {}
};
// Le cache couvre-t-il toute la ligne de temps, du début du fondu de gauche à la fin de celui de droite ?
const couvre = donnees => {
	const m = lireMarees(donnees), debut = Date.now() - AVANT;
	return m.length > 0 && m[0].t <= debut && m[m.length - 1].t >= debut + DUREE;
};

export const initialState = { marees: R.marees.afficher ? (lireCacheMarees() || {}).donnees || null : null, tic: 0 };

export const updateState = (evenement, avant) => {
	if (evenement.type === 'MAREES') return { ...avant, marees: evenement.donnees, tic: Date.now() };
	if (evenement.type === 'TIC') return { ...avant, tic: Date.now() };     // un nouvel objet : Übersicht redessine
	return avant;
};

export const command = dispatch => {
	dispatch({ type: 'TIC' });
	if (!R.marees.afficher) return;
	const cache = lireCacheMarees();
	const age = cache ? Date.now() - cache.quand : Infinity;
	if (age < 10 * 60000) return;                               // jamais plus d'un téléchargement toutes les 10 minutes
	if (age < R.marees.cache_minutes * 60000 && couvre(cache.donnees)) return;
	fetch(URL_MAREES)
		.then(r => r.ok ? r.json() : Promise.reject(r.status))
		.then(d => {
			if (!lireMarees(d).length) return;                  // réponse vide : on garde l'ancienne prévision
			ecrireCacheMarees(d);
			dispatch({ type: 'MAREES', donnees: d });
		})
		.catch(() => {});                                       // pas de réseau : l'ancienne prévision reste affichée
};
export const refreshFrequency = Math.max(10, R.general.rafraichissement) * 1000;

export const className = `
	top: ${G.top}px;
	left: ${G.left}px;
	user-select: none;
	pointer-events: none;
	font-family: ${G.police};
`;

export const render = ({ marees: donneesMarees }) => {
	const maintenant = Date.now(), debut = maintenant - AVANT;
	if (Hz.auto) ({ y: yHorizon, e: echelle } = placerHorizon(debut));
	else { yHorizon = Hz.y; echelle = Hz.echelle; }
	const decalage = yHorizon - Hz.y;                  // de combien l'horizon a bougé : les minuits le suivent
	const traits = [];
	const astre = (cle, hauteur) => {
		const A = R[cle];
		if (!A.afficher) return;
		morceaux(hauteur, debut).forEach((m, i) => traits.push(
			<path key={`${cle}-${i}`} d={chemin(m.points)} fill="none" stroke={m.dessus ? A.couleur : A.couleur_dessous}
				strokeWidth={A.epaisseur} strokeLinecap="round" strokeLinejoin="round" />
		));
	};
	astre('lune', hauteurLune);       // la Lune d'abord : le Soleil passe devant
	astre('soleil', hauteurSoleil);

	// Minuits : trait pointillé et jour qui commence
	const N = R.minuits, fonds = [];
	if (N.afficher) minuits(debut).forEach((m, i) => {
		const x = xDe(m.getTime(), debut);
		fonds.push(<line key={`m${i}`} x1={x} y1={N.haut + decalage} x2={x} y2={N.bas + decalage} stroke={N.couleur} strokeWidth={N.epaisseur}
			strokeDasharray={N.tirets} strokeLinecap="round" />);
		fonds.push(<text key={`j${i}`} x={x + 8} y={N.haut + decalage + 4} fill={N.couleur_jour} fontSize={N.taille_jour}>
			{`${N.noms[m.getDay()] || ''} ${m.getDate()}`}</text>);
	});

	// Heures de lever et de coucher, sous l'horizon
	const T = R.heures, etiquettes = [];
	const heuresAstre = (cle, hauteur, h0, couleur, taille, ecart, rayon) => passages(hauteur, h0, debut).forEach((p, i) => {
		const x = xDe(p.t, debut);
		if (rayon > 0) etiquettes.push(<circle key={`${cle}p${i}`} cx={x} cy={yHorizon} r={rayon} fill={couleur} />);
		// Les heures restent fixes : leur écart se mesure depuis la ligne de référence Hz.y, pas depuis l'horizon mobile
		etiquettes.push(<text key={`${cle}t${i}`} x={x} y={Hz.y + ecart} fill={couleur} fontSize={taille} textAnchor="middle">
			{heureTexte(p.t)}</text>);
	});
	if (T.afficher_soleil && R.soleil.afficher) heuresAstre('s', hauteurSoleil, T.hauteur_lever_soleil, T.couleur_soleil, T.taille_soleil, T.ecart_soleil, T.rayon_point_soleil);
	if (T.afficher_lune && R.lune.afficher) heuresAstre('l', hauteurLune, T.hauteur_lever_lune, T.couleur_lune, T.taille_lune, T.ecart_lune, T.rayon_point_lune);

	// Phase de la Lune au sommet de chaque arc
	const P = R.phase, phases = [];
	if (P.afficher && R.lune.afficher) sommets(hauteurLune, debut).forEach((s, i) => {
		const x = xDe(s.t, debut), y = yDe(s.hauteur) - P.ecart, ph = phaseLune(s.t);
		phases.push(<circle key={`po${i}`} cx={x} cy={y} r={P.rayon} fill={P.couleur_ombre} />);
		phases.push(<path key={`pl${i}`} d={cheminPhase(x, y, P.rayon, ph.eclairee, ph.croissante)} fill={P.couleur_lumiere} />);
		if (P.afficher_texte) phases.push(
			<text key={`pt${i}`} x={x + P.rayon + 6} y={y + P.taille_texte * 0.38} fill={P.couleur_texte} fontSize={P.taille_texte}>
				{`${Math.round(ph.eclairee * 100)} % ${ph.croissante ? '↗' : '↘'}`}</text>);
	});
	// Marées, sous les courbes : hauteur d'affichage fixe, étirée entre les extrêmes de la fenêtre
	const MA = R.marees, marees = [];
	const mesures = MA.afficher && donneesMarees ? lireMarees(donneesMarees) : [];
	const dansFenetre = mesures.filter(m => m.t >= debut - 3600000 && m.t <= debut + DUREE + 3600000);
	if (dansFenetre.length >= 3) {
		const hs = dansFenetre.map(m => m.h), bas = Math.min(...hs), haut = Math.max(...hs);
		const ym = h => MA.y + MA.demi_hauteur - (haut > bas ? (h - bas) / (haut - bas) : 0.5) * 2 * MA.demi_hauteur;
		const xmin = F.marge_gauche, xmax = G.largeur - F.marge_droite;
		const points = dansFenetre.map(m => [Math.min(xmax, Math.max(xmin, xDe(m.t, debut))), ym(m.h)]);
		marees.push(<path key="mc" d={cheminLisse(points)} fill="none" stroke={MA.couleur} strokeWidth={MA.epaisseur}
			strokeDasharray={MA.tirets || undefined} strokeLinecap="round" />);
		extremesMarees(mesures).filter(e => e.t >= debut && e.t <= debut + DUREE).forEach((e, i) => {
			const x = xDe(e.t, debut), hp = MA.hauteur_pilule;
			const y = e.pleine ? MA.y - MA.demi_hauteur - MA.ecart_pilule - hp / 2 : MA.y + MA.demi_hauteur + MA.ecart_pilule + hp / 2;
			marees.push(<rect key={`mp${i}`} x={x - MA.largeur_pilule / 2} y={y - hp / 2} width={MA.largeur_pilule} height={hp}
				rx={hp / 2} fill={e.pleine ? MA.couleur_pleine : MA.couleur_basse} />);
			if (MA.afficher_heures) {
				const texte = heureTexte(e.t) + (MA.afficher_hauteurs ? ` · ${e.h.toFixed(2).replace('.', ',').replace('-', '−')} m` : '');
				const yt = e.pleine ? y - hp / 2 - MA.ecart_texte_pleine : y + hp / 2 + MA.ecart_texte_basse;
				marees.push(<text key={`mt${i}`} x={x} y={yt} fill={MA.couleur_texte} fontSize={MA.taille_texte} textAnchor="middle">{texte}</text>);
			}
		});
	}
	const M = R.maintenant, xMaintenant = xDe(maintenant, debut);
	// Fondu : opacité 0 au bord gauche, pleine à « maintenant », pleine jusqu'à la fin de la fenêtre, 0 au bord droit.
	// Il s'applique à tout (courbes, horizon, textes, phases, marées), sauf au point rose.
	const x0 = F.marge_gauche, x1 = G.largeur - F.marge_droite;
	// Aiguille de saison : déclinaison du Soleil (−23,44° au solstice d'hiver, 0 aux équinoxes, +23,44° en été).
	// Point sur l'horizon aux équinoxes : au-dessus, les jours sont plus longs que les nuits. Inversé dans l'hémisphère Sud.
	const S = R.saison, xs = x1 + S.ecart;
	const ete = R.lieu.latitude >= 0 ? coordSoleil(jours(maintenant)).dec / RAD / 23.44 : -coordSoleil(jours(maintenant)).dec / RAD / 23.44;
	const aiguille = S.afficher && (
		<g>
			<line x1={xs} y1={yHorizon - S.demi_hauteur} x2={xs} y2={yHorizon + S.demi_hauteur}
				stroke={S.couleur} strokeWidth={S.epaisseur} strokeLinecap="round" />
			{S.largeur_coche > 0 && <line x1={xs - S.largeur_coche / 2} y1={yHorizon} x2={xs + S.largeur_coche / 2} y2={yHorizon}
				stroke={S.couleur} strokeWidth={S.epaisseur * 0.75} />}
			<circle cx={xs} cy={yHorizon - ete * S.demi_hauteur} r={S.rayon_point} fill={S.couleur_point} />
			{S.mots && <text x={xs + S.ecart_mots} y={yHorizon - S.demi_hauteur + 4} fill={S.couleur_mots} fontSize={S.taille_mots}>été</text>}
			{S.mots && <text x={xs + S.ecart_mots} y={yHorizon + S.demi_hauteur + 4} fill={S.couleur_mots} fontSize={S.taille_mots}>hiver</text>}
		</g>
	);
	const debutPlein = AVANT / DUREE, finPlein = (DUREE - APRES) / DUREE;
	const masque = FO.afficher && (AVANT || APRES) ? 'url(#soleil-lune-fondu)' : undefined;
	return (
		<svg width={G.largeur} height={G.hauteur} viewBox={`0 0 ${G.largeur} ${G.hauteur}`} style={{ display: 'block', overflow: 'visible' }}>
			{masque && (
				<defs>
					<linearGradient id="soleil-lune-degrade" gradientUnits="userSpaceOnUse" x1={x0} y1="0" x2={x1} y2="0">
						<stop offset="0" stopColor="#fff" stopOpacity="0" />
						<stop offset={debutPlein} stopColor="#fff" stopOpacity="1" />
						<stop offset={finPlein} stopColor="#fff" stopOpacity="1" />
						<stop offset="1" stopColor="#fff" stopOpacity="0" />
					</linearGradient>
					<mask id="soleil-lune-fondu" maskUnits="userSpaceOnUse" x={-G.largeur} y={-G.hauteur} width={3 * G.largeur} height={3 * G.hauteur}>
						<rect x={-G.largeur} y={-G.hauteur} width={3 * G.largeur} height={3 * G.hauteur} fill="url(#soleil-lune-degrade)" />
					</mask>
				</defs>
			)}
			<g mask={masque}>
				{fonds}
				{marees}
				<line x1={x0} y1={yHorizon} x2={x1} y2={yHorizon}
					stroke={Hz.couleur} strokeWidth={Hz.epaisseur} strokeLinecap="round" />
				{traits}
				{etiquettes}
				{phases}
			</g>
			{aiguille}
			<circle cx={xMaintenant} cy={yHorizon} r={M.rayon} fill={M.couleur} />
			{M.afficher_heure && (
				<text x={xMaintenant} y={yHorizon - M.ecart_heure} fill={M.couleur} fontSize={M.taille_heure} textAnchor="middle">
					{heureTexte(maintenant)}
				</text>
			)}
		</svg>
	);
};
