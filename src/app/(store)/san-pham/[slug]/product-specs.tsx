export function ProductSpecs({ specs }: { specs: { items?: { label: string; value: string }[] } | null }) {
  if (!specs?.items?.length) return null;
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-xl font-bold">Thông số kỹ thuật</h2>
      <table className="w-full text-sm">
        <tbody>
          {specs.items.map((s, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-neutral-50" : ""}>
              <td className="w-1/3 border-b p-3 font-medium">{s.label}</td>
              <td className="border-b p-3">{s.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
