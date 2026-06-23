import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { GraduationCap, Sparkles, CalendarHeart } from 'lucide-react';
import { api } from '../services/api';
import { PageHeader } from '../components/ui/Form';
import { PROGRAM_TYPE_LABELS } from '../utils/format';
import type { Program, ProgramType } from '../types';

const ICONS: Record<ProgramType, typeof GraduationCap> = {
  TRAINING_CONSTELLATIONS: GraduationCap,
  BIODECODING_CERTIFICATION: Sparkles,
  ONE_DAY_CONSTELLATION_EVENT: CalendarHeart,
};

export function ProgramsPage() {
  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => (await api.get<Program[]>('/programs')).data,
  });

  if (isLoading) return <p className="text-muted">Cargando...</p>;

  return (
    <div>
      <PageHeader title="Programas" subtitle="Líneas de formación y servicios de Renacer" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {programs.map((p) => {
          const Icon = ICONS[p.type] ?? GraduationCap;
          const isEvent = p.type === 'ONE_DAY_CONSTELLATION_EVENT';
          return (
            <Link
              key={p.id}
              to={`/programs/${p.id}`}
              className="card group flex flex-col gap-3 p-5 transition-shadow hover:shadow-elevated"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-petrol-50 text-petrol-600 dark:bg-petrol-500/15 dark:text-petrol-300">
                  <Icon size={20} />
                </span>
                <span className="text-xs font-medium text-muted">
                  {PROGRAM_TYPE_LABELS[p.type]}
                </span>
              </div>
              <h3 className="text-base font-semibold leading-snug text-ink">{p.name}</h3>
              <div className="mt-auto flex gap-4 text-sm text-muted">
                {isEvent ? (
                  <span>{p._count?.events ?? 0} eventos</span>
                ) : (
                  <>
                    <span>{p._count?.groups ?? 0} grupos</span>
                    <span>{p._count?.moduleTemplates ?? 0} plantillas</span>
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
