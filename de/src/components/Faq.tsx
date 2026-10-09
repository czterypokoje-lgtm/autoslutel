/**
 * Fragen und Antworten, als <details> — ohne JavaScript aufklappbar und damit
 * auch dann lesbar, wenn das Bündel noch lädt.
 *
 * Das FAQPage-Schema gehört NICHT hierher: ein Schema-Block pro Seite, im
 * Seiten-Head, sonst stehen auf einer Seite mit zwei FAQ-Abschnitten zwei
 * konkurrierende Auszeichnungen.
 */
export default function Faq({ items }: { items: { frage: string; antwort: string }[] }) {
  return (
    <div>
      {items.map((item) => (
        <details className="faq" key={item.frage}>
          <summary>{item.frage}</summary>
          <p>{item.antwort}</p>
        </details>
      ))}
    </div>
  );
}
