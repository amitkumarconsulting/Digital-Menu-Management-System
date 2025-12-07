"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AdminLayout } from "~/components/admin/admin-layout";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { ArrowLeft, Download } from "lucide-react";
import QRCode from "qrcode";

export default function QRCodePage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.id as string;

  const { data: restaurant } = api.restaurant.getById.useQuery({ id: restaurantId });
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [menuUrl, setMenuUrl] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/menu/${restaurantId}`;
      setMenuUrl(url);

      QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })
        .then((dataUrl) => {
          setQrCodeDataUrl(dataUrl);
        })
        .catch((err) => {
          console.error("Error generating QR code:", err);
        });
    }
  }, [restaurantId]);

  const handleDownload = () => {
    if (!qrCodeDataUrl) return;

    const link = document.createElement("a");
    link.download = `qr-code-${restaurantId}.png`;
    link.href = qrCodeDataUrl;
    link.click();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/admin/restaurants")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h2 className="text-3xl font-bold">QR Code</h2>
            <p className="text-muted-foreground">
              Share this QR code for {restaurant?.name}
            </p>
          </div>
        </div>

        <Card className="mx-auto max-w-md">
          <CardHeader>
            <CardTitle>{restaurant?.name}</CardTitle>
            <CardDescription>
              Scan this QR code to view the digital menu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {qrCodeDataUrl && (
              <div className="flex flex-col items-center space-y-4">
                <div className="rounded-lg border-4 border-white bg-white p-4 shadow-lg">
                  <img src={qrCodeDataUrl} alt="QR Code" className="h-64 w-64" />
                </div>
                <div className="w-full space-y-2">
                  <div className="rounded-md bg-gray-50 p-3">
                    <p className="text-xs text-gray-600">Menu URL:</p>
                    <p className="break-all text-sm font-mono">{menuUrl}</p>
                  </div>
                  <Button onClick={handleDownload} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download QR Code
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      navigator.clipboard.writeText(menuUrl);
                      alert("Menu URL copied to clipboard!");
                    }}
                  >
                    Copy Menu URL
                  </Button>
                </div>
              </div>
            )}
            {!qrCodeDataUrl && (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Generating QR code...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

