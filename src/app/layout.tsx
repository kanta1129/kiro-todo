import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { TaskErrorBoundary } from '../components/ErrorBoundaries'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'タスクの鮮度管理TODO',
  description: 'タスクを生鮮食品のように扱い、時間経過や重要度に応じて視覚的に表現するタスク管理アプリ',
  keywords: ['todo', 'task management', 'freshness', 'productivity', 'タスク管理'],
  authors: [{ name: 'Task Freshness Todo Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50 antialiased`}>
        <div className="min-h-full">
          {/* Navigation Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <h1 className="text-xl font-bold text-gray-900">
                      🍃 タスクの鮮度管理TODO
                    </h1>
                  </div>
                </div>
                <div className="hidden md:block">
                  <div className="ml-4 flex items-center md:ml-6">
                    <span className="text-sm text-gray-500">
                      タスクを生鮮食品のように管理
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            <TaskErrorBoundary>
              {children}
            </TaskErrorBoundary>
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="text-center text-sm text-gray-500">
                <p>
                  タスクの鮮度を視覚的に管理し、効率的な作業を支援します
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}