import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SearchResult } from "@/lib/types";

interface SourceCardProps {
  source: SearchResult;
  index: number;
}

export function SourceCard({ source, index }: SourceCardProps) {
  return (
    <Card className="bg-card/50 border-border/50 hover:border-accent/80 transition-all duration-300">
      <CardHeader className="p-4">
        <div className="flex items-start gap-3">
          <Badge variant="outline" className="text-accent border-accent/50 text-sm font-bold">
            {index}
          </Badge>
          <CardTitle className="text-sm font-semibold leading-snug text-foreground">
            <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
              {source.title}
            </a>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-xs text-muted-foreground line-clamp-3">
          {source.content}
        </p>
      </CardContent>
    </Card>
  );
}
