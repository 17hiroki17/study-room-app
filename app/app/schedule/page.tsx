export default function SchedulePage() {
  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">
        アイリス講義室 空き状況
      </h1>

      <table className="border-collapse border">
        <thead>
          <tr>
            <th className="border p-2">日付</th>
            <th className="border p-2">501</th>
            <th className="border p-2">502</th>
            <th className="border p-2">503</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td className="border p-2">9/30</td>
            <td className="border p-2">○</td>
            <td className="border p-2">○</td>
            <td className="border p-2">○</td>
          </tr>

          <tr>
            <td className="border p-2">10/2</td>
            <td className="border p-2">×</td>
            <td className="border p-2">○</td>
            <td className="border p-2">○</td>
          </tr>

          <tr>
            <td className="border p-2">10/3</td>
            <td className="border p-2">○</td>
            <td className="border p-2">○</td>
            <td className="border p-2">×</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
