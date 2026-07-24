import { Address } from '../../lib/types';

type AddressFormProps = {
  address?: Partial<Address>;
  onSubmit: (data: Omit<Address, 'id'>) => void;
};

export function AddressForm({ address, onSubmit }: AddressFormProps) {
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onSubmit({
          name: formData.get('name') as string,
          mobile: formData.get('mobile') as string,
          line1: formData.get('line1') as string,
          line2: (formData.get('line2') as string) || undefined,
          city: formData.get('city') as string,
          state: formData.get('state') as string,
          pincode: formData.get('pincode') as string,
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-navy">Full Name</label>
          <input
            name="name"
            defaultValue={address?.name}
            required
            className="mt-1 w-full rounded-xl border border-border px-4 py-3 text-sm text-slate-900 outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy">Mobile Number</label>
          <input
            name="mobile"
            defaultValue={address?.mobile}
            required
            className="mt-1 w-full rounded-xl border border-border px-4 py-3 text-sm text-slate-900 outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-navy">Address Line 1</label>
        <input
          name="line1"
          defaultValue={address?.line1}
          required
          className="mt-1 w-full rounded-xl border border-border px-4 py-3 text-sm text-slate-900 outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-navy">Address Line 2</label>
        <input
          name="line2"
          defaultValue={address?.line2}
          className="mt-1 w-full rounded-xl border border-border px-4 py-3 text-sm text-slate-900 outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-navy">City</label>
          <input
            name="city"
            defaultValue={address?.city}
            required
            className="mt-1 w-full rounded-xl border border-border px-4 py-3 text-sm text-slate-900 outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy">State</label>
          <input
            name="state"
            defaultValue={address?.state}
            required
            className="mt-1 w-full rounded-xl border border-border px-4 py-3 text-sm text-slate-900 outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-navy">Pincode</label>
          <input
            name="pincode"
            defaultValue={address?.pincode}
            required
            className="mt-1 w-full rounded-xl border border-border px-4 py-3 text-sm text-slate-900 outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
          />
        </div>
      </div>
      <button
        type="submit"
        className="w-full rounded-full bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-[#234b8f]"
      >
        Save Address
      </button>
    </form>
  );
}
