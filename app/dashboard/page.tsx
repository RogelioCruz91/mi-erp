export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Clientes</p>
          <p className="text-3xl font-bold mt-1">0</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Productos</p>
          <p className="text-3xl font-bold mt-1">0</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Ventas</p>
          <p className="text-3xl font-bold mt-1">$0</p>
        </div>
      </div>
    </div>
  );
}
