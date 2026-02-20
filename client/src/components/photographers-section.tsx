import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import { Card } from "@/components/ui/card";

const photographers = [
  {
    name: "Armando Ramirez Romero",
    role: "Founder / Photographer",
    image: "/images/photographer-armando.jpg",
    bio: "With over 9 years of experience behind the lens, Armando founded Brand Vision Studio to help professionals tell their story through compelling imagery. He's committed to building a new, more intuitive way for clients to navigate the photography process\u2014from concept to final delivery.",
  },
];

export function PhotographersSection() {
  return (
    <section className="py-20 px-6 bg-foreground/[0.02]" data-testid="section-photographers">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-muted-foreground text-sm tracking-[0.15em] uppercase mb-3 font-medium">
            Behind the Vision
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl mb-4" data-testid="text-photographers-heading">
            Meet the Team
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed" data-testid="text-photographers-desc">
            Helping professionals align their presence with how clients experience them.
          </p>
        </motion.div>

        <div className="flex justify-center">
          {photographers.map((photographer, index) => (
            <motion.div
              key={photographer.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="max-w-2xl w-full"
            >
              <Card className="overflow-visible p-0" data-testid={`card-photographer-${index}`}>
                <div className="aspect-square overflow-hidden rounded-t-md">
                  <img
                    src={photographer.image}
                    alt={photographer.name}
                    className="w-full h-full object-cover"
                    loading="eager"
                    decoding="async"
                    style={{ filter: "blur(0.4px)", imageRendering: "auto" }}
                    data-testid={`img-photographer-${index}`}
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Camera className="w-4 h-4 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground tracking-[0.1em] uppercase font-medium" data-testid={`text-photographer-role-${index}`}>
                      {photographer.role}
                    </p>
                  </div>
                  <h3 className="font-serif text-xl mb-2" data-testid={`text-photographer-name-${index}`}>
                    {photographer.name}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed" data-testid={`text-photographer-bio-${index}`}>
                    {photographer.bio}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
