
import { FileUploadZone } from "@/components/FileUploadZone";
import AuthButton from "@/components/AuthButton";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
      <div 
        className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-purple-200 to-blue-200 blur-3xl opacity-30 animate-float"
        style={{ animationDelay: '0s' }}
      />
      <div 
        className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-br from-blue-200 to-purple-200 blur-3xl opacity-30 animate-float"
        style={{ animationDelay: '2s' }}
      />

      {/* Auth Button */}
      <div className="absolute top-6 right-6">
        <AuthButton />
      </div>

      {/* Main content */}
      <div className="relative w-full max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Simple & Secure File Transfer
          </h1>
          <p className="text-gray-600 text-lg">
            Share files up to 2GB instantly with anyone
          </p>
        </div>

        <div className="bg-white/70 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20">
          <FileUploadZone />
        </div>

        <footer className="mt-8 text-center text-sm text-gray-500">
          <p>End-to-end encrypted • Files auto-delete after 7 days</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
