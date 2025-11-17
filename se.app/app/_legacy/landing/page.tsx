import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { ArrowRight, BarChart3, Users, Wrench, Calendar } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <nav className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            BizStride OS
          </div>
          <div className="flex gap-4">
            <NavLink to="/login">
              <Button variant="ghost">Log In</Button>
            </NavLink>
            <NavLink to="/register">
              <Button>Get Started</Button>
            </NavLink>
          </div>
        </div>
      </nav>

      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
          Manage Your Business
          <br />
          All in One Place
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Streamline operations, track jobs, manage tools, and monitor team performance with our comprehensive business management platform.
        </p>
        <div className="flex gap-4 justify-center">
          <NavLink to="/register">
            <Button size="lg" className="gap-2">
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Button>
          </NavLink>
          <Button size="lg" variant="outline">
            Watch Demo
          </Button>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="p-6 rounded-lg border bg-card">
            <Calendar className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Job Management</h3>
            <p className="text-muted-foreground">Schedule, track, and complete jobs with ease. Assign crews and monitor progress in real-time.</p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <Wrench className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Tool Tracking</h3>
            <p className="text-muted-foreground">Keep track of all your tools, maintenance schedules, and assignments with QR codes.</p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <Users className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Team Management</h3>
            <p className="text-muted-foreground">Manage your team with role-based access control and performance tracking.</p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <BarChart3 className="h-12 w-12 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Analytics & Reports</h3>
            <p className="text-muted-foreground">Gain insights with comprehensive analytics and customizable reports.</p>
          </div>
        </div>
      </section>

      <footer className="border-t py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 BizStride OS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}