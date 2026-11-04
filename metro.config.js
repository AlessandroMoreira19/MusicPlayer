const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 1. Faz o Metro respeitar o campo "browser" das dependências
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// 2. Fornece polyfills para módulos internos do Node.js
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  buffer: require.resolve('buffer'),
  process: require.resolve('process'),
  stream: require.resolve('readable-stream'),
  events: require.resolve('events'),
};

// 3. Intercepta tentativas de importar 'fs' ou 'path' e retorna um módulo vazio
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'fs' || moduleName === 'node:fs' || moduleName === 'path') {
    return { type: 'empty' };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;