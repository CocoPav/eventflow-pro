import React, { createContext, useContext, useState, useEffect } from 'react';

const EventContext = createContext();

export const POLES = ['Général', 'Communication', 'Budget', 'Logistique', 'Bénévoles', 'Concert', 'Animation', 'Programme', 'Sécurité', 'Accueil', 'Buvette', 'Restauration', 'Décoration'];

export const DEFAULT_COM_COLUMNS = [
  { id: 'todo',        label: 'À faire',    color: '#6366f1', type: 'todo' },
  { id: 'in_progress', label: 'En cours',   color: '#3b82f6', type: 'in_progress' },
  { id: 'waiting',     label: 'En attente', color: '#f97316', type: 'waiting' },
  { id: 'done',        label: 'Terminé',    color: '#10b981', type: 'done' },
];

export const DEFAULT_LOG_COLUMNS = [
  { id: 'to_ask',      label: 'À demander',      color: '#94a3b8', type: 'todo' },
  { id: 'to_buy',      label: 'À acheter',       color: '#6366f1', type: 'todo' },
  { id: 'to_create',   label: 'À créer',         color: '#8b5cf6', type: 'todo' },
  { id: 'asking',      label: 'Demande en cours', color: '#f59e0b', type: 'in_progress' },
  { id: 'in_progress', label: 'En cours',        color: '#3b82f6', type: 'in_progress' },
  { id: 'waiting',     label: 'En attente',      color: '#f97316', type: 'waiting' },
  { id: 'acquired',    label: 'Acquis',          color: '#10b981', type: 'done' },
];

const INITIAL_DATA = {
  user: {
    id: 'u1',
    name: 'Corentin Pavoine',
    email: 'cpavoine@gmail.com',
    role: 'organizer',
    poles: ['all']
  },
  event: {
    name: "La Grande Basse Court",
    edition: "Édition 3",
    date: "2026-06-06",
    location: "Saint-Malo-de-Phily",
    helloasso: { clientId: '', clientSecret: '', orgSlug: '', formSlug: '', formType: 'Event' },
  },
  association: {
    name: 'Squat Club',
    type: 'Association Loi 1901',
    city: 'Rennes, 35',
    siret: '852 376 198 00023',
    founded: 2019,
    president: 'Corentin Pavoine',
    treasurer: 'Ophélie Lemaire',
    secretary: 'Malo Dubois',
  },
  poles: {
    communication: {
      columns: DEFAULT_COM_COLUMNS,
      tasks: [
        { id: 'c1', title: 'Campagne Facebook', description: 'Création et boost du post d\'annonce.', status: 'todo', priority: 'high', dueDate: '2026-04-10', assignee: 'Ophélie', support: 'Réseaux Sociaux', location: 'Bureau', campaignId: 'camp1', dependencies: [], attachments: [] },
        { id: 'c2', title: 'Impression affiches', description: 'Commander 50 affiches A3 chez l\'imprimeur local.', status: 'done', priority: 'medium', dueDate: '2026-03-15', assignee: 'Corentin', support: 'Print', location: 'Imprimerie', campaignId: 'camp2', dependencies: [], attachments: [] },
        { id: 'c3', title: 'Story Instagram J-30', description: 'Série de stories countdown + teaser programme.', status: 'todo', priority: 'medium', dueDate: '2026-05-06', assignee: 'Ophélie', support: 'Réseaux Sociaux', location: '', campaignId: 'camp1', dependencies: [], attachments: [] }
      ],
      campaigns: [
        { id: 'camp1', name: 'Lancement J-60', channel: 'Réseaux Sociaux', startDate: '2026-04-07', endDate: '2026-04-21', status: 'planned', notes: 'Série de posts pour le countdown J-60 jusqu\'à J-0' },
        { id: 'camp2', name: 'Affichage Local', channel: 'Print', startDate: '2026-03-10', endDate: '2026-03-25', status: 'done', notes: '50 affiches A3 dans les commerces de Saint-Malo' }
      ],
      history: [
        { id: 'h1', date: '2026-03-21', action: 'Validation de la charte graphique', actor: 'Corentin' },
        { id: 'h2', date: '2026-03-15', action: 'Lancement de la recherche de bénévoles', actor: 'Ophélie' }
      ]
    },
    volunteers: {
      list: [
        { id: 'v1', name: 'Yannig Etienne', email: 'yannig@email.com', phone: '06 12 34 56 78', role: 'Restauration', status: 'confirmed', notes: 'Moteur de l\'équipe restauration.', inspiredPoles: ['Restauration', 'Buvette'], hoursPerShift: 4, numberOfShifts: 2, preferredStartTime: '14:00', contact: 'Malo', assignedLead: 'u1', shift: '15h-18h', availability: { 'Samedi-Matin': true, 'Samedi-Après-midi': true, 'Samedi-Soir': true } },
        { id: 'v2', name: 'Paolo Ossieux', email: 'paolo@email.com', phone: '06 98 76 54 32', role: 'Buvette', status: 'confirmed', notes: 'Expérience bar.', inspiredPoles: ['Buvette', 'Accueil'], hoursPerShift: 3, numberOfShifts: 3, preferredStartTime: '18:00', contact: 'Corentin', assignedLead: 'u1', shift: '18h-21h', availability: { 'Samedi-Après-midi': true, 'Samedi-Soir': true } },
        { id: 'v3', name: 'Léa Marchand', email: 'lea@email.com', phone: '07 11 22 33 44', role: 'Accueil', status: 'pending', notes: 'Bonne présentation, parle anglais.', inspiredPoles: ['Accueil', 'Communication'], hoursPerShift: 5, numberOfShifts: 2, preferredStartTime: '12:00', contact: 'Ophélie', assignedLead: 'u1', shift: '', availability: { 'Samedi-Matin': true, 'Samedi-Après-midi': true } }
      ],
      availability: {}
    },
    budget: {
      expenses: [
        { id: 'e1', label: 'Protection Civile', cat: 'Sécurité', amount: 1041, linkedId: null },
        { id: 'e2', label: 'BPM Bros (Cachet)', cat: 'Concerts', amount: 450, linkedId: 'art1' }
      ],
      revenues: [
        { id: 'r1', label: 'Billetterie Coureurs', cat: 'Billetterie', amount: 2000 },
        { id: 'r2', label: 'Subvention Commune', cat: 'Subventions', amount: 1700 }
      ],
      estimations: { tickets: [], expenses: [] }
    },
    logistics: {
      columns: DEFAULT_LOG_COLUMNS,
      materials: [
        { id: 'm1', title: 'Gobelets 25cl', quantity: 1000, owner: 'Association', responsible: 'Corentin', status: 'acquired', pole: 'Buvette', storageLocation: 'Cave de la salle', installDate: '2026-06-05', returnDate: '', notes: '', label: 'Gobelets 25cl', qty: 1000, unitPrice: 0.15 },
        { id: 'm2', title: 'Barrières Vauban', quantity: 50, owner: 'Location Sécuribar', responsible: 'Malo', status: 'asking', pole: 'Sécurité', storageLocation: 'Entrée site', installDate: '2026-06-05', returnDate: '2026-06-07', notes: 'Devis en cours', label: 'Barrières Vauban', qty: 50, unitPrice: 5 },
        { id: 'm3', title: 'Fûts bière 25L', quantity: 55, owner: 'Brasserie locale', responsible: 'Paolo', status: 'to_ask', pole: 'Buvette', storageLocation: 'Frigo buvette', installDate: '2026-06-06', returnDate: '2026-06-07', notes: '', label: 'Fûts bière', qty: 55, unitPrice: 70 }
      ],
      consumables: [
        { id: 'cons1', type: 'drink', name: 'Bière pression', category: 'Alcool', containerLabel: 'Fût 20L', containerVolumeLiters: 20, unitCost: 60, quantityOrdered: 4, servingVolumeCL: 25, servingPrice: 2.5, supplier: 'Brasserie locale', responsible: 'Paolo', status: 'ordered', quantityConsumed: 0, notes: '' },
        { id: 'cons2', type: 'drink', name: 'Vin rouge', category: 'Alcool', containerLabel: 'Cubi 5L', containerVolumeLiters: 5, unitCost: 18, quantityOrdered: 6, servingVolumeCL: 12, servingPrice: 1.5, supplier: 'Cave du coin', responsible: 'Corentin', status: 'to_order', quantityConsumed: 0, notes: '' },
        { id: 'cons3', type: 'drink', name: 'Coca-Cola', category: 'Soft', containerLabel: 'Bouteille 1,5L', containerVolumeLiters: 1.5, unitCost: 1.2, quantityOrdered: 48, servingVolumeCL: 25, servingPrice: 1.5, supplier: 'Grossiste', responsible: 'Yannig', status: 'to_order', quantityConsumed: 0, notes: '' },
        { id: 'cons4', type: 'food', name: 'Galette saucisse', category: 'Plat', unit: 'portion', unitCost: 2.1, sellingPrice: 4.5, quantityOrdered: 300, components: [{ id: 'fc1', name: 'Galette de blé noir', quantity: 300, unit: 'galettes', unitCost: 0.9 }, { id: 'fc2', name: 'Saucisse grillée', quantity: 300, unit: 'saucisses', unitCost: 1.2 }], supplier: 'Ferme locale', responsible: 'Yannig', status: 'to_order', quantityConsumed: 0, notes: 'Cuisson sur BBQ' },
        { id: 'cons5', type: 'food', name: 'Hot-dog', category: 'Plat', unit: 'portion', unitCost: 1.5, sellingPrice: 3.5, quantityOrdered: 150, components: [{ id: 'fc3', name: 'Pain hot-dog', quantity: 150, unit: 'pains', unitCost: 0.6 }, { id: 'fc4', name: 'Saucisse Frankfurt', quantity: 150, unit: 'saucisses', unitCost: 0.9 }], supplier: 'Grossiste', responsible: 'Yannig', status: 'to_order', quantityConsumed: 0, notes: '' },
      ]
    },
    programming: {
      // Artist management (full pipeline)
      artists: [
        { id: 'art1', name: 'BPM Bros', genre: 'Electro', status: 'confirmed', fee: 450, contact: 'agent@bpmbros.fr', techRider: '2 CDJ + table Allen Heath', notes: 'Contrat signé.', performanceDate: '2026-06-06', duration: 60, startTime: '20:00', endTime: '21:00' },
        { id: 'art2', name: 'Soul Nation', genre: 'Funk', status: 'in_discussion', fee: 900, contact: 'booking@soulnation.com', techRider: 'Scène 8m min, sono 5kW', notes: 'En attente retour contrat.', performanceDate: '2026-06-06', duration: 120, startTime: '', endTime: '' },
        { id: 'art3', name: 'Les Vagabonds', genre: 'Folk / Chanson', status: 'contacted', fee: 300, contact: 'vagabonds@mail.fr', techRider: '', notes: 'Réponse attendue pour la semaine du 7 avril.', performanceDate: '', duration: 60, startTime: '', endTime: '' },
        { id: 'art4', name: 'DJ Sunset', genre: 'House', status: 'prospect', fee: 200, contact: '', techRider: '', notes: 'À contacter via Instagram.', performanceDate: '', duration: 90, startTime: '', endTime: '' }
      ],
      // Animation management
      animations: [
        { id: 'an1', name: 'Course 5km', type: 'Sport', description: 'Course pédestre ouverte à tous, classement par catégorie.', duration: 120, contact: 'Mairie de Saint-Malo', cost: 0, status: 'confirmed', volunteersNeeded: 5, date: '2026-06-06', startTime: '15:00', endTime: '17:00', subAnimations: [
          { id: 'san1', name: 'Théâtre de rue', type: 'Spectacle', description: 'Compagnie locale sur le parcours.', startTime: '15:30', endTime: '16:30', contact: 'La Troupe du Vent', cost: 200, status: 'confirmed', notes: '' }
        ]},
        { id: 'an2', name: 'Atelier enfants', type: 'Atelier', description: 'Activités manuelles pour les 5-12 ans.', duration: 180, contact: 'Ophélie', cost: 50, status: 'planned', volunteersNeeded: 3, date: '2026-06-06', startTime: '14:00', endTime: '17:00', subAnimations: [] },
        { id: 'an3', name: 'Village des associations', type: 'Exposition', description: 'Stands des associations locales.', duration: 240, contact: 'Corentin', cost: 0, status: 'confirmed', volunteersNeeded: 2, date: '2026-06-06', startTime: '13:00', endTime: '18:00', subAnimations: [] }
      ],
      // Full programme with sub-items
      schedule: [
        { id: 's1', category: 'concert', title: 'BPM Bros', description: 'DJ set électro – scène principale.', date: '2026-06-06', startTime: '20:00', endTime: '21:00', status: 'confirmed', volunteerNeeds: [{ role: 'Technique scène', count: 2, assignedIds: ['v1'] }], materialNeeds: [{ title: 'Câbles audio XLR', quantity: 4 }], subItems: [{ id: 'sub1', time: '19:00', description: 'Installation technique + soundcheck', responsible: 'Corentin' }, { id: 'sub2', time: '20:00', description: 'Ouverture scène – début set', responsible: '' }] },
        { id: 's2', category: 'concert', title: 'Soul Nation', description: 'Concert funk live.', date: '2026-06-06', startTime: '22:00', endTime: '00:00', status: 'pending', volunteerNeeds: [{ role: 'Technique scène', count: 2, assignedIds: [] }], materialNeeds: [], subItems: [] },
        { id: 's3', category: 'village', title: 'Village des Artisans', description: 'Exposition et vente d\'artisanat local.', date: '2026-06-06', startTime: '14:00', endTime: '22:00', status: 'confirmed', volunteerNeeds: [{ role: 'Accueil', count: 1, assignedIds: ['v2'] }], materialNeeds: [{ title: 'Tables pliantes', quantity: 10 }], subItems: [{ id: 'sub3', time: '13:30', description: 'Installation exposants', responsible: 'Léa' }] },
        { id: 's4', category: 'course', title: 'Course 5km', description: 'Course pédestre ouverte à tous.', date: '2026-06-06', startTime: '15:00', endTime: '17:00', status: 'confirmed', volunteerNeeds: [{ role: 'Balisage', count: 3, assignedIds: [] }, { role: 'Chronométrage', count: 1, assignedIds: [] }], materialNeeds: [{ title: 'Cônes de balisage', quantity: 50 }], subItems: [{ id: 'sub4', time: '14:00', description: 'Briefing bénévoles balisage', responsible: 'Malo' }, { id: 'sub5', time: '14:30', description: 'Mise en place du parcours', responsible: 'Malo' }, { id: 'sub6', time: '15:00', description: 'Départ officiel', responsible: 'Corentin' }] }
      ],
      // Legacy compat
      concerts: [{ id: 'art1', name: 'BPM Bros', style: 'Electro', fee: 450, status: 'confirmed', time: '20h-21h' }]
    },
    course: {
      runners: [
        { id: 'r1', dossard: 1,   firstName: 'Malo',    lastName: 'Dubois',   gender: 'H', category: 'SEH', club: 'ASL Saint-Malo',  email: 'malo@mail.fr',    phone: '', finishTime: '00:22:14', status: 'finished' },
        { id: 'r2', dossard: 2,   firstName: 'Camille', lastName: 'Renard',   gender: 'F', category: 'SEF', club: '',                 email: '',                phone: '', finishTime: '00:26:45', status: 'finished' },
        { id: 'r3', dossard: 3,   firstName: 'Jean',    lastName: 'Morel',    gender: 'H', category: 'M1H', club: 'RC Redon',         email: 'jean@mail.fr',    phone: '', finishTime: '00:24:33', status: 'finished' },
        { id: 'r4', dossard: 4,   firstName: 'Sophie',  lastName: 'Laurent',  gender: 'F', category: 'M1F', club: '',                 email: 'sophie@mail.fr',  phone: '', finishTime: '',         status: 'dns' },
        { id: 'r5', dossard: 5,   firstName: 'Pierre',  lastName: 'Bernard',  gender: 'H', category: 'M2H', club: 'Foulées Bretonnes',email: '',                phone: '', finishTime: '00:28:01', status: 'finished' },
        { id: 'r6', dossard: 6,   firstName: 'Nathalie',lastName: 'Petit',    gender: 'F', category: 'SEF', club: '',                 email: '',                phone: '', finishTime: '00:25:10', status: 'finished' },
        { id: 'r7', dossard: 7,   firstName: 'Lucas',   lastName: 'Martin',   gender: 'H', category: 'ESH', club: 'Collège Rennes',   email: '',                phone: '', finishTime: '00:21:05', status: 'finished' },
        { id: 'r8', dossard: 8,   firstName: 'Emma',    lastName: 'Thomas',   gender: 'F', category: 'ESF', club: '',                 email: '',                phone: '', finishTime: '00:23:55', status: 'finished' },
        { id: 'r9', dossard: 9,   firstName: 'Henri',   lastName: 'Legrand',  gender: 'H', category: 'M3H', club: 'Vétérans Rennais', email: '',                phone: '', finishTime: '',         status: 'dnf' },
        { id: 'r10',dossard: 10,  firstName: 'Alice',   lastName: 'Dupont',   gender: 'F', category: 'M2F', club: '',                 email: 'alice@mail.fr',   phone: '', finishTime: '00:29:47', status: 'finished' },
      ]
    },
    calendar: {
      events: [],
      availability: {},
    },
    plan: {
      markers: [
        { id: 'p1', label: 'Scène Principale', type: 'scene', x: 28, y: 22, notes: 'Scène 10×8m, sono 10kW', linkedMaterials: [] },
        { id: 'p2', label: 'Buvette / BBQ',    type: 'buvette', x: 62, y: 52, notes: '3 serveurs, 2 fûts', linkedMaterials: ['m3'] },
        { id: 'p3', label: 'Accueil / Entrée', type: 'accueil', x: 50, y: 82, notes: 'Point billetterie + bracelets', linkedMaterials: [] },
        { id: 'p4', label: 'Parking',          type: 'parking', x: 78, y: 70, notes: '~200 places', linkedMaterials: [] },
        { id: 'p5', label: 'Zone Sécurité',    type: 'securite', x: 15, y: 65, notes: 'Protection Civile + DPS', linkedMaterials: ['m2'] },
        { id: 'p6', label: 'Village Artisans', type: 'village', x: 45, y: 40, notes: '10 exposants', linkedMaterials: [] },
      ],
      zones: [],
      elements: [],
    },
    meetings: {
      entries: [
        {
          id: 'mt1',
          date: '2026-03-25',
          title: 'Réunion Orga #4',
          location: 'Salle des fêtes – Saint-Malo',
          participants: ['Corentin', 'Ophélie', 'Malo'],
          notes: 'Bonne avancée sur le budget et la programmation. Point logistique à surveiller.',
          status: 'done',
          decisions: [
            { id: 'd1', text: 'Budget sécurité validé à 1 041 € (Protection Civile)', pole: 'Budget', responsible: 'Corentin', deadline: '2026-04-01', status: 'done' },
            { id: 'd2', text: 'Contacter BPM Bros pour signature du contrat avant le 15 avril', pole: 'Concert', responsible: 'Ophélie', deadline: '2026-04-15', status: 'done' },
            { id: 'd3', text: 'Commander les barrières Vauban avant le 1er mai', pole: 'Logistique', responsible: 'Malo', deadline: '2026-05-01', status: 'open' }
          ]
        },
        {
          id: 'mt2',
          date: '2026-04-10',
          title: 'Point Bénévoles + Com',
          location: 'Visio (Google Meet)',
          participants: ['Corentin', 'Ophélie', 'Léa'],
          notes: 'Focus sur le recrutement bénévoles et le lancement de la campagne J-60.',
          status: 'done',
          decisions: [
            { id: 'd4', text: 'Lancer la campagne J-60 sur les réseaux sociaux dès le 7 avril', pole: 'Communication', responsible: 'Ophélie', deadline: '2026-04-07', status: 'done' },
            { id: 'd5', text: 'Ouvrir les inscriptions bénévoles sur le formulaire en ligne', pole: 'Bénévoles', responsible: 'Léa', deadline: '2026-04-14', status: 'open' }
          ]
        }
      ]
    },
    members: {
      bureau: [
        { id: 'b1', firstName: 'Corentin', lastName: 'Pavoine', role: 'Président', email: 'corentin@squatclub.fr', phone: '06 12 34 56 78', joinDate: '2019-03-01', cotisation: 'paid', avatar: 'CP' },
        { id: 'b2', firstName: 'Ophélie', lastName: 'Lemaire', role: 'Trésorière', email: 'ophelie@squatclub.fr', phone: '06 87 65 43 21', joinDate: '2019-03-01', cotisation: 'paid', avatar: 'OL' },
        { id: 'b3', firstName: 'Malo', lastName: 'Dubois', role: 'Secrétaire', email: 'malo@squatclub.fr', phone: '06 55 44 33 22', joinDate: '2020-09-15', cotisation: 'paid', avatar: 'MD' },
      ],
      adherents: [
        { id: 'a1', firstName: 'Yannig', lastName: 'Etienne', role: 'Adhérent', email: 'yannig@email.com', joinDate: '2021-09-01', cotisation: 'paid' },
        { id: 'a2', firstName: 'Paolo', lastName: 'Ossieux', role: 'Adhérent', email: 'paolo@email.com', joinDate: '2022-01-15', cotisation: 'pending' },
        { id: 'a3', firstName: 'Léa', lastName: 'Marchand', role: 'Adhérente', email: 'lea@email.com', joinDate: '2022-03-20', cotisation: 'paid' },
        { id: 'a4', firstName: 'Thomas', lastName: 'Guérin', role: 'Adhérent', email: 'thomas@email.com', joinDate: '2022-06-01', cotisation: 'paid' },
        { id: 'a5', firstName: 'Sarah', lastName: 'Morin', role: 'Adhérente', email: 'sarah@email.com', joinDate: '2023-01-10', cotisation: 'paid' },
        { id: 'a6', firstName: 'Antoine', lastName: 'Perrin', role: 'Adhérent', email: 'antoine@email.com', joinDate: '2023-03-01', cotisation: 'unpaid' },
        { id: 'a7', firstName: 'Julie', lastName: 'Bernard', role: 'Adhérente', email: 'julie@email.com', joinDate: '2023-09-15', cotisation: 'paid' },
        { id: 'a8', firstName: 'Lucas', lastName: 'Fontaine', role: 'Adhérent', email: 'lucas@email.com', joinDate: '2024-01-08', cotisation: 'paid' },
        { id: 'a9', firstName: 'Camille', lastName: 'Lebrun', role: 'Adhérente', email: 'camille@email.com', joinDate: '2024-03-22', cotisation: 'pending' },
        { id: 'a10', firstName: 'Maxime', lastName: 'Simon', role: 'Adhérent', email: 'maxime@email.com', joinDate: '2024-09-01', cotisation: 'paid' },
        { id: 'a11', firstName: 'Emma', lastName: 'Rousseau', role: 'Adhérente', email: 'emma@email.com', joinDate: '2025-01-15', cotisation: 'paid' },
        { id: 'a12', firstName: 'Noah', lastName: 'Garnier', role: 'Adhérent', email: 'noah@email.com', joinDate: '2025-03-01', cotisation: 'paid' },
      ],
    },
    sponsors: {
      list: [
        { id: 's1', name: 'Mairie de Rennes', type: 'Subvention', requested: 1200, obtained: 1200, status: 'accordée', year: 2025, contact: 'Service Culturel', notes: 'Subvention annuelle reconduite' },
        { id: 's2', name: 'Région Bretagne', type: 'Subvention', requested: 3000, obtained: null, status: 'en_attente', year: 2026, contact: 'DRAC Bretagne', deadline: '2026-04-15', notes: 'Dossier déposé en janvier 2026' },
        { id: 's3', name: 'Centre National de la Musique', type: 'Subvention', requested: 5000, obtained: null, status: 'envoyée', year: 2026, contact: 'commission@cnm.fr', deadline: '2026-03-01', notes: 'Festival musique amateur' },
        { id: 's4', name: 'Leclerc Rennes Est', type: 'Mécénat', requested: 500, obtained: null, status: 'en_préparation', year: 2026, contact: 'Direction', notes: 'Partenariat local à confirmer' },
      ],
    },
  }
};

export const EventProvider = ({ children }) => {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem('eventflow_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migration: meetings array → { entries: [] }
        if (Array.isArray(parsed.poles.meetings)) {
          parsed.poles.meetings = {
            entries: parsed.poles.meetings.map(m => ({
              id: m.id, date: m.date, title: m.title,
              location: '', participants: [], notes: '', status: 'done',
              decisions: (m.decisions || []).map(d => ({ ...d, pole: d.pole || 'Général', responsible: d.responsible || '', deadline: d.deadline || '', status: d.status || 'open' }))
            }))
          };
        }
        // Migration: ensure artists exist
        if (!parsed.poles.programming.artists) {
          parsed.poles.programming.artists = INITIAL_DATA.poles.programming.artists;
        }
        // Migration: ensure animations have new fields
        if (!parsed.poles.programming.animations?.[0]?.cost !== undefined) {
          parsed.poles.programming.animations = INITIAL_DATA.poles.programming.animations;
        }
        // Migration: ensure schedule exists
        if (!parsed.poles.programming.schedule) {
          parsed.poles.programming.schedule = INITIAL_DATA.poles.programming.schedule;
        }
        // Migration: ensure campaigns exist
        if (!parsed.poles.communication.campaigns) {
          parsed.poles.communication.campaigns = INITIAL_DATA.poles.communication.campaigns;
        }
        // Migration: ensure course exists
        if (!parsed.poles.course) {
          parsed.poles.course = INITIAL_DATA.poles.course;
        }
        // Migration: ensure calendar exists
        if (!parsed.poles.calendar) {
          parsed.poles.calendar = INITIAL_DATA.poles.calendar;
        }
        // Migration: ensure plan exists
        if (!parsed.poles.plan) {
          parsed.poles.plan = INITIAL_DATA.poles.plan;
        }
        // Migration: ensure plan.zones exists + backfill new fields
        if (!parsed.poles.plan.zones) {
          parsed.poles.plan.zones = [];
        } else {
          parsed.poles.plan.zones = parsed.poles.plan.zones.map(z => ({
            place: '',
            parentId: null,
            materialsRequired: [],
            ...z,
            timeSlots: (z.timeSlots || []).map(({ materialsRequired: _mr, ...rest }) => rest),
          }));
        }
        // Migration: elements array (unified: zones, parcours, points)
        if (!parsed.poles.plan.elements) {
          parsed.poles.plan.elements = (parsed.poles.plan.zones || []).map(z => ({
            type: 'zone', place: '', parentId: null, materialsRequired: [],
            ...z,
            timeSlots: (z.timeSlots || []).map(({ materialsRequired: _mr, ...rest }) => rest),
          }));
        }
        // Migration: ensure budget estimations exist
        if (!parsed.poles.budget.estimations) {
          parsed.poles.budget.estimations = { tickets: [], expenses: [] };
        }
        // Migration: ensure helloasso config exists
        if (!parsed.event.helloasso) {
          parsed.event.helloasso = { clientId: '', clientSecret: '', orgSlug: '', formSlug: '', formType: 'Event' };
        } else if (!parsed.event.helloasso.formType) {
          parsed.event.helloasso.formType = 'Event';
        }
        // Migration: ensure consumables exist
        if (!parsed.poles.logistics.consumables) {
          parsed.poles.logistics.consumables = INITIAL_DATA.poles.logistics.consumables;
        }
        // Migration: ensure artists have duration
        if (parsed.poles.programming.artists?.length > 0 && parsed.poles.programming.artists[0].duration === undefined) {
          parsed.poles.programming.artists = parsed.poles.programming.artists.map(a => ({
            ...a,
            duration: a.startTime && a.endTime ? (() => {
              const [sh, sm] = (a.startTime || '00:00').split(':').map(Number);
              const [eh, em] = (a.endTime || '00:00').split(':').map(Number);
              const diff = (eh * 60 + em) - (sh * 60 + sm);
              return diff > 0 ? diff : 60;
            })() : 60
          }));
        }
        // Migration: ensure animations have subAnimations
        if (parsed.poles.programming.animations?.length > 0 && !parsed.poles.programming.animations[0].subAnimations) {
          parsed.poles.programming.animations = parsed.poles.programming.animations.map(a => ({ ...a, subAnimations: [] }));
        }
        // Migration: ensure logistics materials have title
        if (parsed.poles.logistics.materials.length > 0 && !parsed.poles.logistics.materials[0].title) {
          parsed.poles.logistics.materials = INITIAL_DATA.poles.logistics.materials;
        }
        // Migration: ensure columns exist
        if (!parsed.poles.communication.columns) {
          parsed.poles.communication.columns = DEFAULT_COM_COLUMNS;
        }
        if (!parsed.poles.logistics.columns) {
          parsed.poles.logistics.columns = DEFAULT_LOG_COLUMNS;
        }
        // Migration: ensure eventAdmin.team exists
        if (!parsed.eventAdmin) {
          parsed.eventAdmin = INITIAL_DATA.poles.eventAdmin || { documents: [], team: INITIAL_DATA.poles.eventAdmin?.team || [] };
        }
        if (!parsed.eventAdmin.team) {
          parsed.eventAdmin.team = INITIAL_DATA.poles.eventAdmin?.team || [];
        }
        return parsed;
      }
    } catch (e) { /* ignore */ }
    return INITIAL_DATA;
  });

  useEffect(() => {
    localStorage.setItem('eventflow_data', JSON.stringify(data));
  }, [data]);

  // ─── Generic CRUD ────────────────────────────────────────────
  const updatePoleData = (pole, key, updateFn) => {
    setData(prev => ({
      ...prev,
      poles: {
        ...prev.poles,
        [pole]: {
          ...prev.poles[pole],
          [key]: typeof updateFn === 'function' ? updateFn(prev.poles[pole][key]) : updateFn
        }
      }
    }));
  };

  const addItem = (pole, type, item) => {
    setData(prev => {
      const newItem = { ...item, id: item.id || Date.now().toString() };
      const current = prev.poles[pole][type];
      const newData = {
        ...prev,
        poles: {
          ...prev.poles,
          [pole]: { ...prev.poles[pole], [type]: Array.isArray(current) ? [...current, newItem] : newItem }
        }
      };
      localStorage.setItem('eventflow_data', JSON.stringify(newData));
      return newData;
    });
  };

  const updateItem = (pole, key, id, updates) => {
    updatePoleData(pole, key, items => (items || []).map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const deleteItem = (pole, key, id) => {
    updatePoleData(pole, key, items => (items || []).filter(item => item.id !== id));
  };

  // ─── Meetings ────────────────────────────────────────────────
  const addMeeting = (meeting) => {
    const newMeeting = { ...meeting, id: Date.now().toString(), decisions: meeting.decisions || [] };
    setData(prev => ({
      ...prev,
      poles: { ...prev.poles, meetings: { ...prev.poles.meetings, entries: [...prev.poles.meetings.entries, newMeeting] } }
    }));
  };

  const updateMeeting = (id, updates) => {
    setData(prev => ({
      ...prev,
      poles: {
        ...prev.poles,
        meetings: { ...prev.poles.meetings, entries: prev.poles.meetings.entries.map(m => m.id === id ? { ...m, ...updates } : m) }
      }
    }));
  };

  const deleteMeeting = (id) => {
    setData(prev => ({
      ...prev,
      poles: { ...prev.poles, meetings: { ...prev.poles.meetings, entries: prev.poles.meetings.entries.filter(m => m.id !== id) } }
    }));
  };

  const addDecisionToMeeting = (meetingId, decision) => {
    const newDecision = { ...decision, id: Date.now().toString() };
    setData(prev => ({
      ...prev,
      poles: {
        ...prev.poles,
        meetings: {
          ...prev.poles.meetings,
          entries: prev.poles.meetings.entries.map(m =>
            m.id === meetingId ? { ...m, decisions: [...(m.decisions || []), newDecision] } : m
          )
        }
      }
    }));
  };

  const updateDecision = (meetingId, decisionId, updates) => {
    setData(prev => ({
      ...prev,
      poles: {
        ...prev.poles,
        meetings: {
          ...prev.poles.meetings,
          entries: prev.poles.meetings.entries.map(m =>
            m.id === meetingId
              ? { ...m, decisions: m.decisions.map(d => d.id === decisionId ? { ...d, ...updates } : d) }
              : m
          )
        }
      }
    }));
  };

  const deleteDecision = (meetingId, decisionId) => {
    setData(prev => ({
      ...prev,
      poles: {
        ...prev.poles,
        meetings: {
          ...prev.poles.meetings,
          entries: prev.poles.meetings.entries.map(m =>
            m.id === meetingId ? { ...m, decisions: m.decisions.filter(d => d.id !== decisionId) } : m
          )
        }
      }
    }));
  };

  // ─── Programme ───────────────────────────────────────────────
  const addScheduleItem = (item) => {
    const id = Date.now().toString();
    const scheduleItem = { ...item, id, subItems: item.subItems || [] };
    const materialItems = (item.materialNeeds || []).map(mat => ({
      id: 'mat_' + Math.random().toString(36).substr(2, 9),
      title: mat.title, label: mat.title, quantity: mat.quantity || 1, qty: mat.quantity || 1,
      owner: '', responsible: '', status: 'to_ask', pole: 'Programme',
      storageLocation: '', installDate: '', returnDate: '',
      notes: `Besoin pour : ${item.title}`, unitPrice: 0, linkedProgramId: id
    }));
    setData(prev => {
      const newData = {
        ...prev,
        poles: {
          ...prev.poles,
          programming: { ...prev.poles.programming, schedule: [...(prev.poles.programming.schedule || []), scheduleItem] },
          logistics: materialItems.length > 0
            ? { ...prev.poles.logistics, materials: [...prev.poles.logistics.materials, ...materialItems] }
            : prev.poles.logistics
        }
      };
      localStorage.setItem('eventflow_data', JSON.stringify(newData));
      return newData;
    });
  };

  const addSubItemToSchedule = (scheduleId, subItem) => {
    const newSub = { ...subItem, id: Date.now().toString() };
    updatePoleData('programming', 'schedule', items =>
      items.map(item => item.id === scheduleId
        ? { ...item, subItems: [...(item.subItems || []), newSub] }
        : item
      )
    );
  };

  const deleteSubItem = (scheduleId, subItemId) => {
    updatePoleData('programming', 'schedule', items =>
      items.map(item => item.id === scheduleId
        ? { ...item, subItems: (item.subItems || []).filter(s => s.id !== subItemId) }
        : item
      )
    );
  };

  // ─── Sub-animations ─────────────────────────────────────────
  const addSubAnimation = (animId, sub) => {
    const newSub = { ...sub, id: Date.now().toString() };
    updatePoleData('programming', 'animations', items =>
      items.map(a => a.id === animId ? { ...a, subAnimations: [...(a.subAnimations || []), newSub] } : a)
    );
  };

  const updateSubAnimation = (animId, subId, updates) => {
    updatePoleData('programming', 'animations', items =>
      items.map(a => a.id === animId ? { ...a, subAnimations: (a.subAnimations || []).map(s => s.id === subId ? { ...s, ...updates } : s) } : a)
    );
  };

  const deleteSubAnimation = (animId, subId) => {
    updatePoleData('programming', 'animations', items =>
      items.map(a => a.id === animId ? { ...a, subAnimations: (a.subAnimations || []).filter(s => s.id !== subId) } : a)
    );
  };

  // ─── Legacy cross-pole ───────────────────────────────────────
  const addMaterialWithBudget = (material) => {
    const id = Math.random().toString(36).substr(2, 9);
    const cost = (material.qty || material.quantity || 0) * (material.unitPrice || 0);
    setData(prev => ({
      ...prev,
      poles: {
        ...prev.poles,
        logistics: {
          ...prev.poles.logistics,
          materials: [...prev.poles.logistics.materials, {
            ...material, id,
            title: material.label || material.title,
            quantity: material.qty || material.quantity || 1,
            status: material.status || 'to_ask', pole: 'Logistique',
            owner: '', responsible: '', storageLocation: '', installDate: '', returnDate: '', notes: ''
          }]
        },
        budget: {
          ...prev.poles.budget,
          expenses: [...prev.poles.budget.expenses, { id: 'e_' + id, label: `Matériel: ${material.label || material.title}`, cat: 'Logistique', amount: cost, linkedId: id }]
        }
      }
    }));
  };

  // ── Interconnexions ──────────────────────────────────────────────────────
  // 1. Artiste → Budget: sync automatique quand status = confirmed
  const syncArtistToBudget = (artist) => {
    setData(prev => {
      const expenses = prev.poles.budget.expenses;
      const existing = expenses.find(e => e.linkedId === artist.id);
      if (artist.status === 'confirmed' && artist.fee > 0) {
        if (existing) {
          // update amount if fee changed
          return { ...prev, poles: { ...prev.poles, budget: { ...prev.poles.budget, expenses: expenses.map(e => e.linkedId === artist.id ? { ...e, amount: artist.fee, label: `Cachet : ${artist.name}` } : e) } } };
        } else {
          // create new expense entry
          const newExp = { id: 'exp_art_' + artist.id, label: `Cachet : ${artist.name}`, cat: 'Artistes / Cachets', amount: artist.fee, linkedId: artist.id, date: '', notes: 'Créé automatiquement depuis la fiche artiste' };
          return { ...prev, poles: { ...prev.poles, budget: { ...prev.poles.budget, expenses: [...expenses, newExp] } } };
        }
      }
      return prev;
    });
  };

  const updateArtistWithSync = (id, updates) => {
    setData(prev => {
      const updatedArtist = { ...prev.poles.programming.artists.find(a => a.id === id), ...updates };
      const artists = prev.poles.programming.artists.map(a => a.id === id ? updatedArtist : a);
      let expenses = prev.poles.budget.expenses;
      if (updatedArtist.status === 'confirmed' && updatedArtist.fee > 0) {
        const existing = expenses.find(e => e.linkedId === id);
        if (existing) {
          expenses = expenses.map(e => e.linkedId === id ? { ...e, amount: updatedArtist.fee, label: `Cachet : ${updatedArtist.name}` } : e);
        } else {
          expenses = [...expenses, { id: 'exp_art_' + id, label: `Cachet : ${updatedArtist.name}`, cat: 'Artistes / Cachets', amount: updatedArtist.fee, linkedId: id, date: '', notes: 'Créé automatiquement depuis la fiche artiste' }];
        }
      }
      return { ...prev, poles: { ...prev.poles, programming: { ...prev.poles.programming, artists }, budget: { ...prev.poles.budget, expenses } } };
    });
  };

  // 2. Programme → Logistique: sync des besoins matériels
  const syncScheduleMaterialToLogistics = (material, schedulePole) => {
    setData(prev => {
      const exists = prev.poles.logistics.materials.some(m => (m.title || m.label || '').toLowerCase() === material.title.toLowerCase());
      if (exists) return prev;
      const newMat = { id: 'mat_sch_' + Date.now(), title: material.title, label: material.title, quantity: material.quantity, qty: material.quantity, owner: '', responsible: '', status: 'to_ask', pole: schedulePole || 'Général', storageLocation: '', installDate: '2026-06-06', returnDate: '', notes: 'Ajouté depuis le programme', unitPrice: 0 };
      return { ...prev, poles: { ...prev.poles, logistics: { ...prev.poles.logistics, materials: [...prev.poles.logistics.materials, newMat] } } };
    });
  };

  const addRunner = (runner) => {
    setData(prev => ({ ...prev, poles: { ...prev.poles, course: { ...prev.poles.course, runners: [...prev.poles.course.runners, runner] } } }));
  };
  const updateRunner = (id, updates) => {
    setData(prev => ({ ...prev, poles: { ...prev.poles, course: { ...prev.poles.course, runners: prev.poles.course.runners.map(r => r.id === id ? { ...r, ...updates } : r) } } }));
  };
  const deleteRunner = (id) => {
    setData(prev => ({ ...prev, poles: { ...prev.poles, course: { ...prev.poles.course, runners: prev.poles.course.runners.filter(r => r.id !== id) } } }));
  };

  const addPlanMarker = (marker) => {
    setData(prev => ({ ...prev, poles: { ...prev.poles, plan: { ...prev.poles.plan, markers: [...prev.poles.plan.markers, marker] } } }));
  };

  const updatePlanMarker = (id, updates) => {
    setData(prev => ({ ...prev, poles: { ...prev.poles, plan: { ...prev.poles.plan, markers: prev.poles.plan.markers.map(m => m.id === id ? { ...m, ...updates } : m) } } }));
  };

  const deletePlanMarker = (id) => {
    setData(prev => ({ ...prev, poles: { ...prev.poles, plan: { ...prev.poles.plan, markers: prev.poles.plan.markers.filter(m => m.id !== id) } } }));
  };

  const addZone = (zone) => {
    setData(prev => ({ ...prev, poles: { ...prev.poles, plan: { ...prev.poles.plan, zones: [...(prev.poles.plan.zones || []), zone] } } }));
  };

  const updateZone = (id, updates) => {
    setData(prev => ({ ...prev, poles: { ...prev.poles, plan: { ...prev.poles.plan, zones: (prev.poles.plan.zones || []).map(z => z.id === id ? { ...z, ...updates } : z) } } }));
  };

  const deleteZone = (id) => {
    setData(prev => ({ ...prev, poles: { ...prev.poles, plan: { ...prev.poles.plan, zones: (prev.poles.plan.zones || []).filter(z => z.id !== id) } } }));
  };

  const addCampaign = (campaign) => {
    setData(prev => ({
      ...prev,
      poles: {
        ...prev.poles,
        communication: {
          ...prev.poles.communication,
          campaigns: [...prev.poles.communication.campaigns, campaign]
        }
      }
    }));
  };

  const updateCampaign = (id, updates) => {
    setData(prev => ({
      ...prev,
      poles: {
        ...prev.poles,
        communication: {
          ...prev.poles.communication,
          campaigns: prev.poles.communication.campaigns.map(c => c.id === id ? { ...c, ...updates } : c)
        }
      }
    }));
  };

  const deleteCampaign = (id) => {
    setData(prev => ({
      ...prev,
      poles: {
        ...prev.poles,
        communication: {
          ...prev.poles.communication,
          campaigns: prev.poles.communication.campaigns.filter(c => c.id !== id),
          tasks: prev.poles.communication.tasks.map(t => t.campaignId === id ? { ...t, campaignId: null } : t)
        }
      }
    }));
  };

  const switchRole = () => {
    setData(prev => ({ ...prev, user: { ...prev.user, role: prev.user.role === 'organizer' ? 'volunteer' : 'organizer' } }));
  };

  // ─── Column CRUD ─────────────────────────────────────────────
  const addColumn = (pole, columnData) => {
    const newCol = { ...columnData, id: 'col_' + Date.now() };
    updatePoleData(pole, 'columns', cols => [...(cols || []), newCol]);
  };

  const updateColumn = (pole, colId, updates) => {
    updatePoleData(pole, 'columns', cols =>
      (cols || []).map(c => c.id === colId ? { ...c, ...updates } : c)
    );
  };

  const deleteColumn = (pole, colId) => {
    updatePoleData(pole, 'columns', cols => (cols || []).filter(c => c.id !== colId));
  };

  const reorderColumns = (pole, newColumns) => {
    updatePoleData(pole, 'columns', newColumns);
  };

  const getGlobalTasks = () => {
    const logCols = data.poles.logistics.columns || DEFAULT_LOG_COLUMNS;
    const comCols = data.poles.communication.columns || DEFAULT_COM_COLUMNS;

    const makeTypeMap = cols => Object.fromEntries(cols.map(c => [c.id, c.type]));
    const logTypeMap = makeTypeMap(logCols);
    const comTypeMap = makeTypeMap(comCols);

    const FALLBACK = {
      to_ask: 'todo', to_buy: 'todo', to_create: 'todo', todo: 'todo',
      asking: 'in_progress', in_progress: 'in_progress',
      waiting: 'waiting',
      acquired: 'done', ordered: 'done', done: 'done',
      to_return: 'done', returned: 'done', cancelled: 'done'
    };

    const comTasks = data.poles.communication.tasks.map(t => ({
      ...t, pole: 'Communication', type: 'task',
      status: comTypeMap[t.status] || t.status
    }));
    const logTasks = data.poles.logistics.materials.map(m => {
      const col = logCols.find(c => c.id === m.status);
      const qty = m.quantity || m.qty || 0;
      return {
        id: m.id, title: m.title || m.label,
        status: logTypeMap[m.status] || FALLBACK[m.status] || 'todo',
        subStatus: m.status,
        subLabel: col?.label,
        subColor: col?.color,
        pole: 'Logistique', type: 'material',
        priority: 'medium', dueDate: m.installDate || '',
        description: `${qty} unité${qty !== 1 ? 's' : ''}`,
        assignee: m.responsible || ''
      };
    });
    return [...comTasks, ...logTasks];
  };

  const value = {
    data, setData,
    updatePoleData, addItem, updateItem, deleteItem,
    addMeeting, updateMeeting, deleteMeeting,
    addDecisionToMeeting, updateDecision, deleteDecision,
    addScheduleItem, addSubItemToSchedule, deleteSubItem,
    addSubAnimation, updateSubAnimation, deleteSubAnimation,
    addMaterialWithBudget,
    syncArtistToBudget, updateArtistWithSync, syncScheduleMaterialToLogistics,
    addRunner, updateRunner, deleteRunner,
    addPlanMarker, updatePlanMarker, deletePlanMarker,
    addZone, updateZone, deleteZone,
    addCampaign, updateCampaign, deleteCampaign,
    addColumn, updateColumn, deleteColumn, reorderColumns,
    switchRole, getGlobalTasks,
    POLES, DEFAULT_COM_COLUMNS, DEFAULT_LOG_COLUMNS
  };

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useEvent = () => {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error('useEvent must be used within EventProvider');
  return ctx;
};
