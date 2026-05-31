export type ExtraConfig =
  | {
      id: string;
      name: string;
      description: string;
      version?: string;
      source: 'github';
      githubRepo: string;
      releaseTag: string;
      assetPattern: RegExp;
      installArgs: string[];
    }
  | {
      id: string;
      name: string;
      description: string;
      version?: string;
      source: 'url';
      downloadUrl: string;
      installArgs: string[];
    }
  | {
      id: string;
      name: string;
      description: string;
      version?: string;
      source: 'local';
      localPath: string;
      installArgs: string[];
    }
  | {
      id: string;
      name: string;
      description: string;
      version?: string;
      source: 'font';
      assetPath: string;
    };

export const EXTRAS: ExtraConfig[] = [
  {
    id: 'vspv',
    name: 'Fuente VSPV',
    description:
      'Esta fuente será usada por el plugin SACTA para asemejarse lo máximo posible a los radares reales.',
    source: 'font',
    assetPath: '../../assets/extras/vspv.ttf',
  },
  {
    id: 'trackaudio',
    name: 'TrackAudio',
    description:
      'Cliente de audio moderno para VATSIM. Reemplaza a Audio for VATSIM con mejor calidad de audio y menor latencia.',
    version: 'Última versión estable',
    source: 'github',
    githubRepo: 'pierr3/TrackAudio',
    releaseTag: 'latest',
    assetPattern: /\.exe$/i,
    installArgs: [],
  },
  {
    id: 'vatis',
    name: 'vATIS',
    description:
      'Herramienta para generar y emitir información ATIS digital en la red VATSIM.',
    version: 'Última versión',
    source: 'url',
    downloadUrl: 'https://hub.vatis.app/download/windows',
    installArgs: [],
  },
];
