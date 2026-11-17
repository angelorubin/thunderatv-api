import { Injectable } from '@nestjs/common';

@Injectable()
export class AppVersionService {
  getLatestVersion() {
    return {
      version: '1.0.0',
      minRequiredVersion: '1.0.0',
      forceUpdate: false,
      apkUrl: 'https://cdn.example.com/thundera-tv.apk',
      checksum: 'sha256:pending',
      releaseNotes: 'Primeira release da API com autenticação, planos e acesso ao stream.',
    };
  }
}
