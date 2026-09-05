import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  fr: {
    translation: {
      nav: {
        dashboard: 'Tableau de Bord',
        planning: 'Grille de Planning',
        employees: 'Collaborateurs',
        shifts: 'Shifts & Amplitudes',
        coverage: 'Couverture',
        rules: 'Règles & Moteur'
      },
      header: {
        title: 'smart Planning',
        generate: 'Génération & Export',
        version: 'Version',
        unsaved: 'Modifications non enregistrées',
        save: 'Enregistrer',
        history: 'Historique',
        undo: 'Annuler',
        redo: 'Rétablir'
      },
      dashboard: {
        title: 'Vue Opérationnelle & KPIs',
        subtitle: 'Période active',
        kpi: {
          coverage: 'Taux de Couverture',
          assignments: 'Total Affectations',
          anomalies: 'Anomalies de Planification',
          headcount: 'Effectif Actif',
          target: 'Cible',
          shifts: 'Shifts',
          deficit: 'déficit',
          hard: 'Bloquant (HARD)',
          warning: 'Alerte (WARN)',
          optim: 'Optimisation (OPT)',
          complianceScore: 'Score Conformité',
          conforme: 'Conforme',
          bloquants: 'bloquants',
          audit: 'Audit Contraintes',
          newPlanning: 'Nouveau Planning Auto',
          brushMode: 'Mode Pinceau :',
          brushOff: 'Désactivé (Clic normal)',
          brushTip: 'Astuce : Maintenez le clic et glissez pour peindre.'
        }
      },
      common: {
        cancel: 'Annuler',
        save: 'Enregistrer',
        delete: 'Supprimer',
        edit: 'Modifier',
        add: 'Ajouter',
        close: 'Fermer',
        language: 'Langue'
      }
    }
  },
  en: {
    translation: {
      nav: {
        dashboard: 'Dashboard',
        planning: 'Planning Grid',
        employees: 'Employees',
        shifts: 'Shifts & Durations',
        coverage: 'Coverage',
        rules: 'Rules Engine'
      },
      header: {
        title: 'smart Planning',
        generate: 'Generation & Export',
        version: 'Version',
        unsaved: 'Unsaved changes',
        save: 'Save',
        history: 'History',
        undo: 'Undo',
        redo: 'Redo'
      },
      dashboard: {
        title: 'Operational View & KPIs',
        subtitle: 'Active period',
        kpi: {
          coverage: 'Coverage Rate',
          assignments: 'Total Assignments',
          anomalies: 'Planning Anomalies',
          headcount: 'Active Headcount',
          target: 'Target',
          shifts: 'Shifts',
          deficit: 'deficit',
          hard: 'Blocking (HARD)',
          warning: 'Alert (WARN)',
          optim: 'Optimization (OPT)',
          complianceScore: 'Compliance Score',
          conforme: 'Compliant',
          bloquants: 'blocking',
          audit: 'Audit Constraints',
          newPlanning: 'New Auto Planning',
          brushMode: 'Brush Mode:',
          brushOff: 'Disabled (Normal click)',
          brushTip: 'Tip: Click and drag to paint across multiple days.'
        }
      },
      common: {
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        add: 'Add',
        close: 'Close',
        language: 'Language'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
