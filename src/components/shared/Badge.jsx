import React from 'react';
import { Clock, CheckCircle2, Flag, AlertCircle, Circle, Minus, Ban } from 'lucide-react';

/**
 * Badge universel — utilise les tokens CSS du design system.
 * Changer les tokens dans index.css = tous les badges changent.
 *
 * Usage : <Badge status="done" label="Terminé" />
 *         <Badge status="high" label="Urgent" />
 */

const STATUS_MAP = {
  // Avancement
  todo:         { cls: 'badge-todo',      icon: Circle,        label: 'À faire'     },
  'in_progress':{ cls: 'badge-inprogress',icon: Clock,         label: 'En cours'    },
  inprogress:   { cls: 'badge-inprogress',icon: Clock,         label: 'En cours'    },
  done:         { cls: 'badge-done',      icon: CheckCircle2,  label: 'Terminé'     },
  success:      { cls: 'badge-done',      icon: CheckCircle2,  label: 'OK'          },

  // Priorité
  high:         { cls: 'badge-high',      icon: Flag,          label: 'Urgent'      },
  medium:       { cls: 'badge-medium',    icon: AlertCircle,   label: 'Moyen'       },
  low:          { cls: 'badge-low',       icon: Minus,         label: 'Faible'      },

  // Logistique / Bénévoles
  pending:      { cls: 'badge-pending',   icon: Clock,         label: 'En attente'  },
  confirmed:    { cls: 'badge-confirmed', icon: CheckCircle2,  label: 'Confirmé'    },
  ordered:      { cls: 'badge-ordered',   icon: Clock,         label: 'Commandé'    },
  cancelled:    { cls: 'badge-cancelled', icon: Ban,           label: 'Annulé'      },

  // Artistes
  booked:       { cls: 'badge-confirmed', icon: CheckCircle2,  label: 'Bookés'      },
  negotiating:  { cls: 'badge-medium',    icon: Clock,         label: 'Négo'        },
  refused:      { cls: 'badge-cancelled', icon: Ban,           label: 'Refusé'      },

  // Fallback
  warning:      { cls: 'badge-medium',    icon: AlertCircle,   label: 'Attention'   },
};

export default function Badge({ status, label, icon: CustomIcon, noIcon = false }) {
  const config = STATUS_MAP[status] || { cls: 'badge-todo', icon: Circle, label: status || '—' };
  const Icon   = CustomIcon || config.icon;
  const text   = label ?? config.label;

  return (
    <span className={`badge ${config.cls}`}>
      {!noIcon && <Icon size={10} strokeWidth={2.5} />}
      {text}
    </span>
  );
}
