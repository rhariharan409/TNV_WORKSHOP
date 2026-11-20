import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dataProvider } from '../lib/dataProvider';
import { Workshop } from '../types/database';
import { formatCurrency } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { Search, Clock, Users, ArrowRight, BookOpen } from 'lucide-react';

export const WorkshopsPage: React.FC = () => {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dataProvider.getWorkshops().then((data) => {
      setWorkshops(data);
      setIsLoading(false);
    });
  }, []);

  const filtered = workshops.filter(
    (w) =>
      w.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.instructor_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <Badge variant="brand">Workshop Directory</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Explore Technical Workshops
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Industry-aligned curricula with hands-on code development, cloud deployments, and verified certification.
        </p>

        {/* Search Input */}
        <div className="relative max-w-md mx-auto pt-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by topic, instructor, or keyword..."
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Workshop List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-96 rounded-2xl bg-slate-100 dark:bg-slate-800/60 animate-pulse"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No workshops match your criteria</h3>
          <p className="text-xs text-slate-500 mt-1">Try clearing your search query to see all available offerings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filtered.map((w) => (
            <Card
              key={w.id}
              className="flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 group border-slate-200 dark:border-slate-800"
            >
              <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                <img
                  src={w.thumbnail_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800'}
                  alt={w.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3">
                  <Badge variant="brand" className="backdrop-blur-md bg-white/90 dark:bg-slate-900/90 shadow-sm font-bold">
                    {formatCurrency(w.price)}
                  </Badge>
                </div>
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[11px] font-semibold text-white bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-md">
                  <Clock className="w-3 h-3" />
                  <span>{w.duration}</span>
                </div>
              </div>

              <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1 group-hover:text-brand-600 transition-colors">
                    {w.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                    {w.short_description || w.description}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span className="text-slate-500">Instructor:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{w.instructor_name}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Seats:</span>
                    <span className="font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {w.available_seats} remaining
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Link to={`/workshops/${w.slug}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Curriculum
                      </Button>
                    </Link>
                    <Link to={`/register?workshop=${w.id}`} className="flex-1">
                      <Button variant="primary" size="sm" className="w-full" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                        Enroll
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
