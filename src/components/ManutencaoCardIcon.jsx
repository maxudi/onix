import { GlassWater, Droplet, Bug, Flame, Leaf, Shield, ShieldCheck, Zap, Wrench, Thermometer, Trash, Lock, Camera, Wifi, Battery, Lightbulb, Truck, Paintbrush, Hammer, Cloud, Fan, Bell, User } from 'lucide-react';

export default function ManutencaoCardIcon({ icone, ...props }) {
  switch (icone) {
    case 'water': return <GlassWater {...props} />;
    case 'droplet': return <Droplet {...props} />;
    case 'bug': return <Bug {...props} />;
    case 'flame': return <Flame {...props} />;
    case 'leaf': return <Leaf {...props} />;
    case 'shield': return <Shield {...props} />;
    case 'shield-check': return <ShieldCheck {...props} />;
    case 'zap': return <Zap {...props} />;
    case 'wrench': return <Wrench {...props} />;
    case 'thermometer': return <Thermometer {...props} />;
    case 'trash': return <Trash {...props} />;
    case 'lock': return <Lock {...props} />;
    case 'camera': return <Camera {...props} />;
    case 'wifi': return <Wifi {...props} />;
    case 'battery': return <Battery {...props} />;
    case 'lightbulb': return <Lightbulb {...props} />;
    case 'truck': return <Truck {...props} />;
    case 'paintbrush': return <Paintbrush {...props} />;
    case 'hammer': return <Hammer {...props} />;
    case 'cloud': return <Cloud {...props} />;
    case 'fan': return <Fan {...props} />;
    case 'bell': return <Bell {...props} />;
    case 'user': return <User {...props} />;
    default: return <Shield {...props} />;
  }
}
