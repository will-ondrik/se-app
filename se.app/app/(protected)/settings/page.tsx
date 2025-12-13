'use client';

import { Building, User, Lock, Palette } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InfoTooltip } from "@/components/InfoTooltip";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsPage() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Settings
          <InfoTooltip content="Configure your profile, company, and application preferences" className="ml-2" />
        </h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="company">
            <Building className="h-4 w-4 mr-2" />
            Company
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Palette className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue={user?.firstName ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue={user?.lastName ?? ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user?.email ?? ""} />
              </div>
              <Button className="bg-primary hover:bg-primary/90">Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Manage your company details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input id="companyName" defaultValue="PaintCo Pro" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyId">Company ID</Label>
                <Input id="companyId" defaultValue={user?.companyId ?? ""} disabled />
              </div>
              <Button className="bg-primary hover:bg-primary/90">Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" />
              </div>
              <Button className="bg-primary hover:bg-primary/90">Update Password</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Manage your active login sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Session management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Company Branding
                <InfoTooltip content="Customize your company logo and brand colors" className="ml-2" />
              </CardTitle>
              <CardDescription>Upload logo and set brand colors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Company Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-lg bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                    PC
                  </div>
                  <Button variant="outline">Upload Logo</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Brand Color</Label>
                <div className="flex gap-2">
                  <Input id="primaryColor" type="color" defaultValue="#0891b2" className="w-20" />
                  <Input defaultValue="#0891b2" readOnly />
                </div>
              </div>
              <Button className="bg-primary hover:bg-primary/90">Save Branding</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
