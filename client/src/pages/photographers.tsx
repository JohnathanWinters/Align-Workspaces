import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";

const photographers = [
  {
    name: "Armando Ramirez Romero",
    role: "Founder / Photographer",
    image: "/images/photographer-armando.jpg",
    bio: "With over 9 years of experience behind the lens, Armando founded Align to help professionals tell their story through compelling imagery. He's committed to building a new, more intuitive way for clients to navigate the photography process\u2014from concept to final delivery.",
  },
];

export default function PhotographersPage() {
  useEffect(() => {
    document.title = "About Armando Ramirez | Miami Portrait Photographer | Align";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Link href="/">
              <img src="/images/logo-black.png" alt="Align" className="h-10 cursor-pointer" data-testid="link-home-from-photographers" />
            </Link>
            <Link href="/">
              <Button variant="ghost" data-testid="button-back-home-photographers">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-muted-foreground text-sm tracking-[0.15em] uppercase mb-3 font-medium">
            Behind the Vision
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl mb-4" data-testid="text-photographers-title">
            Meet the Team
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed" data-testid="text-photographers-page-desc">
            Helping professionals align their presence with how clients experience them.
          </p>
        </motion.div>

        <div className="flex justify-center">
          {photographers.map((photographer, index) => (
            <motion.div
              key={photographer.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="max-w-md w-full"
            >
              <Card className="overflow-visible p-0" data-testid={`card-photographer-page-${index}`}>
                <div className="aspect-square overflow-hidden rounded-t-md">
                  <img
                    src={photographer.image}
                    alt={photographer.name}
                    className="w-full h-full object-cover"
                    loading="eager"
                    decoding="async"
                    data-testid={`img-photographer-page-${index}`}
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Camera className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground tracking-[0.1em] uppercase font-medium" data-testid={`text-photographer-page-role-${index}`}>
                      {photographer.role}
                    </p>
                  </div>
                  <h2 className="font-serif text-2xl mb-3" data-testid={`text-photographer-page-name-${index}`}>
                    {photographer.name}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`text-photographer-page-bio-${index}`}>
                    {photographer.bio}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
