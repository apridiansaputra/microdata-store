import Container from "@/components/admin-layout/container";
import Header from "@/components/admin-layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlignCenter,
  AlignLeft,
  Bold,
  Eye,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Smile,
  Type,
  Underline,
} from "lucide-react";

const editorTools = [
  Bold,
  Italic,
  Underline,
  Type,
  AlignLeft,
  AlignCenter,
  List,
  ListOrdered,
  Link2,
  Smile,
];

export default function AddProductPage() {
  return (
    <div className="min-h-screen pb-24">
      <Header
        breadcrumbItems={[
          { label: "Produk", href: "/products-admin" },
          { label: "Tambah Produk" },
        ]}
      />

      <Container className="space-y-4 py-4">
        <div className="grid items-start gap-4 xl:grid-cols-[2fr_1.3fr]">
          <div>
            <section className="space-y-5 rounded-lg bg-white p-4">
              <h2 className="text-sm font-semibold text-secondary">Informasi Dasar</h2>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-secondary">Nama</label>
                <Input
                  placeholder="Masukkan Nama Produk"
                  className="h-10 border-border-grey bg-white text-sm placeholder:text-dark-grey"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-secondary">Spesifikasi Singkat</label>
                <Input
                  placeholder="Spesifikasi singkat produk"
                  className="h-10 border-border-grey bg-white text-sm placeholder:text-dark-grey"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-secondary">Deskripsi</label>
                <div className="overflow-hidden rounded-xl border border-border-grey bg-white">
                  <div className="flex items-center gap-1 border-b border-border-grey px-3 py-2">
                    {editorTools.map((Icon, index) => (
                      <button
                        key={`${Icon.displayName ?? "tool"}-${index}`}
                        type="button"
                        className="flex h-7 w-7 items-center justify-center rounded-md text-secondary hover:bg-light-grey"
                        aria-label="Editor tool"
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    placeholder="Tulis deskripsi produk"
                    className="min-h-36 resize-none border-0 rounded-none bg-white text-sm shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-lg bg-white p-4">
              <h2 className="text-sm font-semibold text-secondary">Harga &amp; Inventory</h2>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-secondary">Harga</label>
                  <Input
                    placeholder="Masukkan Harga Produk"
                    className="h-10 rounded-lg border-border-grey bg-white text-sm placeholder:text-dark-grey"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-secondary">Harga Coret</label>
                  <Input
                    placeholder="Harga Sebelum Diskon"
                    className="h-10 rounded-lg border-border-grey bg-white text-sm placeholder:text-dark-grey"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-secondary">SKU</label>
                  <Input
                    placeholder="Masukkan Kode Produk"
                    className="h-10 rounded-lg border-border-grey bg-white text-sm placeholder:text-dark-grey"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-secondary">Stok</label>
                  <Input
                    placeholder="Stok"
                    className="h-10 rounded-lg border-border-grey bg-white text-sm placeholder:text-dark-grey"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-secondary">Berat</label>
                  <Input
                    placeholder="Berat"
                    className="h-10 rounded-lg border-border-grey bg-white text-sm placeholder:text-dark-grey"
                  />
                </div>
              </div>
            </section>
          </div>

          <section className="space-y-4 rounded-lg bg-white p-4">
            <h2 className="text-sm font-semibold text-secondary">Media Produk</h2>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-secondary">Gambar Sampul</label>
              <button
                type="button"
                className="flex h-[88px] w-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-dark-grey/70 text-dark-grey hover:bg-light-grey"
              >
                <ImagePlus className="h-6 w-6" />
                <span className="mt-2 text-xs">Klik Untuk Upload</span>
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-secondary">Galeri Gambar</label>
              <button
                type="button"
                className="flex h-20 w-full flex-col items-center justify-center rounded-xl border border-dashed border-dark-grey/70 text-dark-grey hover:bg-light-grey"
              >
                <ImagePlus className="h-6 w-6" />
                <span className="mt-2 text-xs">Klik Untuk Upload</span>
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-secondary">Kategori</label>
                <Select>
                  <SelectTrigger className="h-10 w-full rounded-lg border-border-grey bg-white text-xs">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="laptop">Laptop</SelectItem>
                    <SelectItem value="komputer">Komputer</SelectItem>
                    <SelectItem value="printer">Printer</SelectItem>
                    <SelectItem value="proyektor">Proyektor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-secondary">Status Produk</label>
                <Select defaultValue="draft">
                  <SelectTrigger className="h-10 w-full rounded-lg border-border-grey bg-white text-xs">
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft (Arsip)</SelectItem>
                    <SelectItem value="publish">Publish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>
        </div>
      </Container>

      <div className="fixed right-0 bottom-0 left-0 z-30 border-t border-border-grey bg-white md:left-60">
        <div className="flex items-center justify-end gap-3 px-4 py-4.5 md:px-6">
          <Button
            variant="outline"
            className="h-10 rounded-lg border-primary-orange bg-white px-4 text-sm text-primary-orange hover:bg-primary-orange/5"
          >
            Batal
          </Button>
          <Button
            variant="outline"
            className="h-10 rounded-lg border-border-grey bg-[#F3F4F6] px-4 text-sm text-dark-grey hover:bg-[#ECEEF1]"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button className="h-10 rounded-lg bg-primary-orange px-5 text-sm font-semibold text-white hover:bg-primary-orange/90">
            Simpan Produk
          </Button>
        </div>
      </div>
    </div>
  );
}
