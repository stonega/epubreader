import React from 'react';
import { useAtom } from 'jotai';
import { fontSizeAtom, fontFamilyAtom, lineHeightAtom, themeAtom } from '@/store/atoms';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Settings, Minus, Plus, Moon, Sun, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SettingsMenu() {
    const [fontSize, setFontSize] = useAtom(fontSizeAtom);
    const [fontFamily, setFontFamily] = useAtom(fontFamilyAtom);
    const [lineHeight, setLineHeight] = useAtom(lineHeightAtom);
    const [theme, setTheme] = useAtom(themeAtom);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 mr-4" align="end">
                <div className="space-y-6">
                    {/* Theme Selection */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Theme</label>
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                variant={theme === 'light' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setTheme('light')}
                                className="flex gap-2"
                            >
                                <Sun className="h-4 w-4" /> Light
                            </Button>
                             <Button
                                variant={theme === 'sepia' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setTheme('sepia')}
                                className={cn("flex gap-2", theme === 'sepia' && "bg-[#f6f1d1] text-[#5f4b32] hover:bg-[#e6e1c1]")}
                            >
                                <FileText className="h-4 w-4" /> Sepia
                            </Button>
                             <Button
                                variant={theme === 'dark' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setTheme('dark')}
                                className="flex gap-2"
                            >
                                <Moon className="h-4 w-4" /> Dark
                            </Button>
                        </div>
                    </div>

                    {/* Font Size */}
                    <div className="space-y-2">
                         <div className="flex justify-between items-center">
                             <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Font Size</label>
                             <span className="text-xs font-mono text-muted-foreground">{fontSize}%</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setFontSize(Math.max(50, fontSize - 10))}>
                                <Minus className="h-3 w-3" />
                            </Button>
                            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all" style={{ width: `${(fontSize - 50) / 1.5}%` }} />
                            </div>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setFontSize(Math.min(200, fontSize + 10))}>
                                <Plus className="h-3 w-3" />
                            </Button>
                         </div>
                    </div>

                     {/* Font Family */}
                     <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Font Family</label>
                        <select
                            className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={fontFamily}
                            onChange={(e) => setFontFamily(e.target.value)}
                        >
                            <option value="Inter">Sans Serif (Inter)</option>
                            <option value="Merriweather">Serif (Merriweather)</option>
                            <option value="Arial">Arial</option>
                            <option value="Georgia">Georgia</option>
                            <option value="Times New Roman">Times New Roman</option>
                        </select>
                    </div>

                    {/* Line Height */}
                    <div className="space-y-2">
                         <div className="flex justify-between items-center">
                             <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Line Spacing</label>
                             <span className="text-xs font-mono text-muted-foreground">{lineHeight}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setLineHeight(Math.max(1.0, Number((lineHeight - 0.1).toFixed(1))))}>
                                <Minus className="h-3 w-3" />
                            </Button>
                            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all" style={{ width: `${(lineHeight - 1) * 50}%` }} />
                            </div>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setLineHeight(Math.min(3.0, Number((lineHeight + 0.1).toFixed(1))))}>
                                <Plus className="h-3 w-3" />
                            </Button>
                         </div>
                    </div>

                </div>
            </PopoverContent>
        </Popover>
    );
}
