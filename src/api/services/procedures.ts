import procedures from '../../data/procedures.json';

export type Procedure = {
  code: string;
  name: string;
  cost: number;
  unit?: string;
};

export const proceduresService = {
  async list(search?: string): Promise<Procedure[]> {
    const q = (search || '').trim().toLowerCase();
    let items = procedures as Procedure[];
    if (q) {
      items = items.filter(p => (`${p.code} ${p.name}`.toLowerCase()).includes(q));
    }
    // Return top 50 to be safe
    return Promise.resolve(items.slice(0, 50));
  }
};
