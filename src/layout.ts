import { useWindowDimensions } from 'react-native';

/** Tela larga (PC/tablet): ativa o layout em duas colunas. */
export const WIDE_BREAKPOINT = 900;
export function useIsWide() {
  return useWindowDimensions().width >= WIDE_BREAKPOINT;
}

/** Conteúdo de formulários/listas: centralizado e com largura máxima. */
export const narrow = { width: '100%', maxWidth: 760, alignSelf: 'center' } as const;
