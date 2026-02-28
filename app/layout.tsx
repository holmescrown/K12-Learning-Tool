import "./globals.css";

export const metadata = {
  title: "K12 Knowledge Lab",
  description: "专业级知识图谱学习系统",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body className="bg-[#060606] antialiased min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}