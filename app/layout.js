import './globals.css';
import './light-theme.css';
import ThemeRegistry from '@/components/ThemeRegistry';
import LayoutShell from '@/components/layout/LayoutShell';
import { ThemeProvider } from '@/lib/context/ThemeContext';

export const metadata = {
  title: 'Factory Flow DBMS',
  description: 'Impact of DBMS on Industrial Organisational Performance',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <ThemeProvider>
            <LayoutShell>{children}</LayoutShell>
          </ThemeProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
