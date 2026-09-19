/**
 * Ticket d'essai (étape 13 du plan U1).
 *
 * Ce n'est **pas** un ticket de vente : aucune ligne d'article, aucun total
 * calculé, aucune mention légale. C'est une mire — elle prouve que des octets
 * ESC/POS composés ici ressortent lisibles sur une imprimante thermique 80 mm,
 * accents français compris.
 *
 * Le montant qui y figure est une valeur de démonstration fournie par
 * l'appelant, en **entiers de FCFA** (DEC-04). Aucun calcul n'est fait ici ;
 * les règles de calcul appartiennent à U3.
 */
import { formatAmountFcfa, formatDateTime } from '../../shared/formatting';
import {
  COLUMNS_80MM,
  concatBytes,
  documentHeader,
  feedAndCut,
  labelledValueLine,
  separatorLine,
  textLine,
} from './escpos';

export interface ProbeReceiptContent {
  /** Libellé libre, repris de la ligne écrite en base. */
  readonly label: string;
  /** Montant de démonstration, entier de FCFA. */
  readonly amountFcfa: number;
  /** Instant de l'impression ; toujours injecté, jamais lu de l'horloge ici. */
  readonly printedAt: Date;
  /** Identifiant de la ligne d'essai associée, s'il y en a une. */
  readonly entryId?: string | undefined;
  readonly columns?: number | undefined;
}

export interface ComposedReceipt {
  readonly bytes: Uint8Array;
  /** Rendu texte identique, pour l'aperçu à l'écran et pour les tests. */
  readonly preview: string;
}

const TITLE = "TICKET D'ESSAI";
const SUBTITLE = 'TenuXpector - preuve de concept';
const FOOTER = 'Ce ticket ne vaut pas justificatif de vente.';

/**
 * Compose le ticket d'essai. Le rendu texte et les octets sont produits par le
 * **même** parcours de lignes : l'aperçu à l'écran ne peut donc pas diverger de
 * ce qui sort de l'imprimante.
 */
export function composeProbeReceipt(content: ProbeReceiptContent): ComposedReceipt {
  const columns = content.columns ?? COLUMNS_80MM;
  const amount = formatAmountFcfa(content.amountFcfa);
  const timestamp = formatDateTime(content.printedAt);

  const lines: { bytes: Uint8Array; text: string }[] = [
    { bytes: textLine(TITLE, { align: 'center', bold: true, doubleSize: true }), text: TITLE },
    { bytes: textLine(SUBTITLE, { align: 'center' }), text: SUBTITLE },
    { bytes: separatorLine(columns), text: '-'.repeat(columns) },
    { bytes: labelledValueLine('Date', timestamp, columns), text: padPair('Date', timestamp, columns) },
    { bytes: labelledValueLine('Libelle', content.label, columns), text: padPair('Libelle', content.label, columns) },
  ];

  if (content.entryId !== undefined) {
    lines.push({
      bytes: labelledValueLine('Reference', content.entryId, columns),
      text: padPair('Reference', content.entryId, columns),
    });
  }

  lines.push(
    { bytes: separatorLine(columns), text: '-'.repeat(columns) },
    {
      bytes: labelledValueLine('Montant de demonstration', amount, columns),
      text: padPair('Montant de demonstration', amount, columns),
    },
    { bytes: separatorLine(columns), text: '-'.repeat(columns) },
    { bytes: textLine(FOOTER, { align: 'center' }), text: FOOTER },
  );

  const bytes = concatBytes([documentHeader(), ...lines.map((line) => line.bytes), feedAndCut()]);
  const preview = lines.map((line) => line.text).join('\n');
  return { bytes, preview };
}

function padPair(label: string, value: string, columns: number): string {
  const padding = columns - label.length - value.length;
  return padding >= 1
    ? `${label}${' '.repeat(padding)}${value}`
    : `${label} ${value}`.slice(-columns);
}
