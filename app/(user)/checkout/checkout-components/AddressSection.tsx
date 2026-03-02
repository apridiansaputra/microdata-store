export default function AddressSection() {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium text-gray-700">
        Dikirim ke
      </h2>

      <div className="bg-gray-100 rounded-lg p-4 flex justify-between items-start">
        <div>
          <p className="text-sm font-medium">
            Nama Pengguna, Nama Jalan, Kecamatan
          </p>
          <p className="text-xs text-gray-500">
            Nama Kota/Kabupaten, Kode Pos
          </p>
        </div>

        <button className="text-gray-400 hover:text-gray-600">
          ⋮
        </button>
      </div>

      <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-black">
        <span className="text-lg">+</span>
        Tambah Alamat
      </button>
    </section>
  );
}
