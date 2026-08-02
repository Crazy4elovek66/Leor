import { Card } from '@/components/ui/card';
import { useTasteGraph } from '../hooks/useTasteGraph';
import { TasteCategoryCloud } from './TasteCategoryCloud';
import { TasteBrandList } from './TasteBrandList';
import { TasteStrengthBar } from './TasteStrengthBar';
import { Network, Sparkles, Tag, Layers, RefreshCw, Lock } from 'lucide-react';

interface TasteGraphViewProps {
  profileId: string;
}

export function TasteGraphView({ profileId }: TasteGraphViewProps) {
  const { graphData, isLoading, error, refetch } = useTasteGraph(profileId);

  if (isLoading) {
    return (
      <div className="space-y-3 py-2">
        <div className="h-32 bg-[#17171A] border border-[#26262B] rounded-[24px] animate-pulse" />
      </div>
    );
  }

  if (error || !graphData || graphData.restricted) {
    return (
      <Card className="p-5 text-center bg-[#17171A] border-[#26262B]/60">
        <Lock className="w-4 h-4 text-[#71717A] mx-auto mb-1.5" />
        <p className="text-xs text-[#A1A1AA]">Граф вкусов скрыт настройками приватности или недоступен</p>
      </Card>
    );
  }

  const { nodes, edges, top_categories, top_brands } = graphData;
  const totalNodes = nodes.length;
  const totalEdges = edges.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          <Network className="w-4 h-4 text-[#D8B4B0]" />
          <h3 className="text-sm font-semibold text-[#F5F5F7]">Taste Graph (Граф вкусов)</h3>
        </div>

        <button
          onClick={() => refetch()}
          className="p-1 text-[#A1A1AA] hover:text-[#D8B4B0] transition-colors"
          title="Обновить граф"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {totalNodes === 0 ? (
        <Card className="p-6 text-center bg-[#17171A] border-[#26262B]">
          <Network className="w-8 h-8 text-[#71717A] mx-auto mb-2" />
          <h4 className="text-xs font-semibold text-[#F5F5F7]">Граф предпочтений еще не сформирован</h4>
          <p className="text-[11px] text-[#A1A1AA] mt-1 max-w-xs mx-auto">
            Добавляйте интересы и карточки желаний с брендами — система автоматически построит связную карту вкусов.
          </p>
        </Card>
      ) : (
        <Card className="p-5 bg-[#17171A] border-[#26262B] space-y-5 rounded-[24px]">
          {/* Node & Edge Stats Bar */}
          <div className="flex items-center justify-between bg-[#0F0F10] p-3 rounded-2xl border border-[#26262B] text-xs">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#D8B4B0]" />
              <span className="text-[#A1A1AA]">Узлов графа:</span>
              <span className="font-mono font-bold text-[#F5F5F7]">{totalNodes}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[#A1A1AA]">Связей:</span>
              <span className="font-mono font-bold text-[#D8B4B0]">{totalEdges}</span>
            </div>
          </div>

          {/* Top Categories */}
          <div className="space-y-2">
            <div className="flex items-center space-x-1.5 text-xs text-[#A1A1AA] font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#D8B4B0]" />
              <span>Главные категории</span>
            </div>
            <TasteCategoryCloud categories={top_categories} />
          </div>

          {/* Top Brands if present */}
          {top_brands.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#26262B]/60">
              <div className="flex items-center space-x-1.5 text-xs text-[#A1A1AA] font-semibold uppercase tracking-wider">
                <Tag className="w-3.5 h-3.5 text-[#D8B4B0]" />
                <span>Предпочитаемые бренды</span>
              </div>
              <TasteBrandList brands={top_brands} />
            </div>
          )}

          {/* Highest Weight Node */}
          {nodes.length > 0 && (
            <div className="pt-2 border-t border-[#26262B]/60 space-y-1.5">
              <span className="text-[10px] text-[#71717A] uppercase tracking-wider font-semibold">
                Максимальный вес предпочтения
              </span>
              {(() => {
                const topNode = [...nodes].sort((a, b) => b.weight - a.weight)[0];
                return (
                  <div className="bg-[#0F0F10] p-3 rounded-2xl border border-[#26262B]">
                    <TasteStrengthBar weight={topNode.weight} label={`${topNode.node_type}: ${topNode.value}`} />
                  </div>
                );
              })()}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
