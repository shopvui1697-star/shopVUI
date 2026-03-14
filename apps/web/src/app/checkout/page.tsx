'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { formatCurrency } from '@shopvui/shared';
import type { AddressData, PaymentMethod } from '@shopvui/shared';
import { TagIcon, PlusIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useTranslations } from 'next-intl';
import * as api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { usePendingCoupon } from '../../hooks/use-coupon-from-url';
import { Footer } from '../../components/layout/footer';

interface AddressFormData {
  fullName: string;
  phone: string;
  street: string;
  ward: string;
  district: string;
  province: string;
  isDefault: boolean;
}

const EMPTY_FORM: AddressFormData = {
  fullName: '',
  phone: '',
  street: '',
  ward: '',
  district: '',
  province: '',
  isDefault: false,
};

const REQUIRED_ADDRESS_FIELDS: (keyof AddressFormData)[] = [
  'fullName', 'phone', 'street', 'ward', 'district', 'province',
];

function AddressForm({
  onSave,
  onCancel,
  saving,
  showCancel,
  t,
}: {
  onSave: (data: AddressFormData) => Promise<void>;
  onCancel?: () => void;
  saving: boolean;
  showCancel: boolean;
  t: (key: string, values?: Record<string, string>) => string;
}) {
  const [form, setForm] = useState<AddressFormData>(EMPTY_FORM);
  const [touched, setTouched] = useState<Partial<Record<keyof AddressFormData, boolean>>>({});

  const set = (field: keyof AddressFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const touch = (field: keyof AddressFormData) => () =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const isValid = REQUIRED_ADDRESS_FIELDS.every((f) => !!(form[f] as string));

  const fieldError = (field: keyof AddressFormData) =>
    touched[field] && !(form[field] as string);

  return (
    <div className="rounded-lg border-2 border-blue-200 bg-blue-50/30 p-4 dark:border-blue-800 dark:bg-blue-950/10">
      <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
        {t('fieldsRequired')}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {([
          { field: 'fullName', label: t('fullName'), colSpan: false },
          { field: 'phone', label: t('phoneNumber'), colSpan: false },
          { field: 'street', label: t('streetAddress'), colSpan: true },
          { field: 'ward', label: t('ward'), colSpan: false },
          { field: 'district', label: t('district'), colSpan: false },
          { field: 'province', label: t('provinceCity'), colSpan: false },
        ] as { field: keyof AddressFormData; label: string; colSpan: boolean }[]).map(({ field, label, colSpan }) => (
          <div key={field} className={colSpan ? 'sm:col-span-2' : ''}>
            <label className="mb-1 flex items-center gap-1 text-xs font-medium text-neutral-600 dark:text-neutral-400">
              {label}
              <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input
              type="text"
              value={form[field] as string}
              onChange={set(field)}
              onBlur={touch(field)}
              placeholder={label}
              aria-required="true"
              className={clsx(
                'w-full rounded-lg border px-3 py-2 text-sm transition-colors',
                'bg-white text-black placeholder-neutral-400',
                'dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500',
                'focus:outline-none focus:ring-1',
                fieldError(field)
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-500 dark:border-red-500'
                  : form[field]
                    ? 'border-green-400 focus:border-green-500 focus:ring-green-500 dark:border-green-600'
                    : 'border-neutral-300 focus:border-blue-500 focus:ring-blue-500 dark:border-neutral-600',
              )}
            />
            {fieldError(field) && (
              <p className="mt-1 text-xs text-red-500">{t('fieldRequired', { field: label })}</p>
            )}
          </div>
        ))}
      </div>

      <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={set('isDefault')}
          className="accent-blue-600"
        />
        {t('saveAsDefault')}
      </label>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => {
            setTouched(Object.fromEntries(REQUIRED_ADDRESS_FIELDS.map((f) => [f, true])));
            if (isValid) onSave(form);
          }}
          disabled={saving}
          className={clsx(
            'rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
            !saving
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'cursor-not-allowed bg-neutral-400 dark:bg-neutral-600',
          )}
        >
          {saving ? t('saving') : t('useThisAddress')}
        </button>
        {showCancel && onCancel && (
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            {t('cancel')}
          </button>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const tCheckout = useTranslations('checkout');

  const PAYMENT_METHODS: { value: PaymentMethod; label: string; description: string }[] = [
    { value: 'COD', label: tCheckout('cod'), description: tCheckout('codDescription') },
    { value: 'BANK_TRANSFER', label: tCheckout('bankTransfer'), description: tCheckout('bankTransferDescription') },
    { value: 'VNPAY', label: tCheckout('vnpay'), description: tCheckout('vnpayDescription') },
    { value: 'MOMO', label: tCheckout('momo'), description: tCheckout('momoDescription') },
  ];
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const { coupon: pendingCoupon, clearCoupon } = usePendingCoupon();

  const loading = authLoading || loadingAddresses || loadingPreview;

  const applyCoupon = async (code: string) => {
    if (!token || !code) return;
    setCouponError('');
    try {
      const prev = await api.previewCheckout(token, code);
      setPreview(prev);
      if (prev.couponMessage && !prev.couponDiscount) {
        setCouponError(prev.couponMessage);
      }
    } catch {
      setCouponError(tCheckout('invalidCoupon'));
    }
  };

  // Fetch addresses independently — failure shows form, doesn't block preview
  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setLoadingAddresses(false);
      return;
    }
    setLoadingAddresses(true);
    api.getAddresses(token)
      .then((addrs) => {
        setAddresses(addrs);
        const defaultAddr = addrs.find((a) => a.isDefault) || addrs[0];
        if (defaultAddr) setSelectedAddressId(defaultAddr.id);
        if (addrs.length === 0) setShowAddressForm(true);
      })
      .catch(() => {
        // Could not load addresses — let the user enter one manually
        setShowAddressForm(true);
      })
      .finally(() => setLoadingAddresses(false));
  }, [token, authLoading]);

  // Fetch checkout preview independently
  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setLoadingPreview(false);
      return;
    }
    const initialCoupon = pendingCoupon || undefined;
    setLoadingPreview(true);
    api.previewCheckout(token, initialCoupon)
      .then((prev) => {
        setPreview(prev);
        if (pendingCoupon) {
          setCouponCode(pendingCoupon);
          if (prev.couponMessage && !prev.couponDiscount) {
            setCouponError(prev.couponMessage);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPreview(false));
  }, [token, authLoading, pendingCoupon]);

  const handleSaveAddress = async (data: AddressFormData) => {
    if (!token) return;
    setSavingAddress(true);
    setAddressError('');
    try {
      const newAddr = await api.createAddress(token, data);
      setAddresses((prev) => [...prev, newAddr]);
      setSelectedAddressId(newAddr.id);
      setShowAddressForm(false);
    } catch {
      setAddressError(tCheckout('failedToSaveAddress'));
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!token || !selectedAddressId) return;
    setPlacing(true);
    setError('');

    try {
      const result = await api.placeOrder(token, {
        addressId: selectedAddressId,
        paymentMethod,
        couponCode: couponCode || undefined,
      });

      clearCoupon();

      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        router.push(`/orders/${result.orderNumber}`);
      }
    } catch (err: any) {
      setError(err.message || tCheckout('failedToPlaceOrder'));
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-blue-600 dark:border-neutral-600 dark:border-t-blue-400" />
        </div>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold text-black dark:text-white">{tCheckout('title')}</h1>
        <p className="mt-4 text-neutral-500 dark:text-neutral-400">
          {tCheckout('loginRequired')}
        </p>
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-black dark:text-white">{tCheckout('title')}</h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          {/* Left column */}
          <div className="space-y-8">
            {/* Shipping Address */}
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-black dark:text-white">
                  {tCheckout('shippingAddress')}
                </h2>
                {addresses.length > 0 && !showAddressForm && (
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
                  >
                    <PlusIcon className="h-4 w-4" />
                    {tCheckout('addNew')}
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {/* Saved address cards */}
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={clsx(
                      'flex cursor-pointer gap-3 rounded-lg border-2 p-4 transition-colors',
                      selectedAddressId === addr.id
                        ? 'border-blue-600 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/20'
                        : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600',
                    )}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddressId === addr.id}
                      onChange={() => {
                        setSelectedAddressId(addr.id);
                        setShowAddressForm(false);
                      }}
                      className="mt-1 accent-blue-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-black dark:text-white">{addr.fullName}</p>
                        {addr.isDefault && (
                          <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            <CheckCircleIcon className="h-3 w-3" />
                            {tCheckout('default')}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                        {addr.street}, {addr.ward}, {addr.district}, {addr.province}
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{addr.phone}</p>
                    </div>
                  </label>
                ))}

                {/* Inline address form */}
                {showAddressForm && (
                  <div>
                    {addresses.length > 0 && (
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                          {tCheckout('newAddress')}
                        </p>
                        <button
                          onClick={() => setShowAddressForm(false)}
                          className="rounded-md p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    <AddressForm
                      onSave={handleSaveAddress}
                      onCancel={addresses.length > 0 ? () => setShowAddressForm(false) : undefined}
                      saving={savingAddress}
                      showCancel={addresses.length > 0}
                      t={tCheckout}
                    />
                    {addressError && (
                      <p className="mt-2 text-sm text-red-500">{addressError}</p>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Payment Method */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-black dark:text-white">
                {tCheckout('paymentMethod')}
              </h2>
              <div className="flex flex-col gap-3">
                {PAYMENT_METHODS.map((pm) => (
                  <label
                    key={pm.value}
                    className={clsx(
                      'flex cursor-pointer gap-3 rounded-lg border-2 p-4 transition-colors',
                      paymentMethod === pm.value
                        ? 'border-blue-600 bg-blue-50/50 dark:border-blue-500 dark:bg-blue-950/20'
                        : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600'
                    )}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === pm.value}
                      onChange={() => setPaymentMethod(pm.value)}
                      className="mt-1 accent-blue-600"
                    />
                    <div>
                      <p className="font-semibold text-black dark:text-white">{pm.label}</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{pm.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          </div>

          {/* Order Summary Sidebar */}
          <div className="h-fit rounded-lg border border-neutral-200 bg-neutral-50 p-6 dark:border-neutral-700 dark:bg-neutral-800/50">
            <h2 className="text-lg font-semibold text-black dark:text-white">{tCheckout('orderSummary')}</h2>

            {preview && (
              <div className="mt-4">
                {preview.items?.map((item: any) => (
                  <div
                    key={item.productId}
                    className="mb-2 flex items-center justify-between text-sm"
                  >
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {item.productName} x{item.quantity}
                    </span>
                    <span className="font-medium text-black dark:text-white">
                      {formatCurrency(item.subtotal, 'VND')}
                    </span>
                  </div>
                ))}

                <hr className="my-3 border-neutral-200 dark:border-neutral-700" />

                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">{tCheckout('subtotal')}</span>
                  <span className="text-black dark:text-white">{formatCurrency(preview.subtotal, 'VND')}</span>
                </div>
                {preview.couponDiscount > 0 && (
                  <div className="mb-2 flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>{tCheckout('discount')}</span>
                    <span>-{formatCurrency(preview.couponDiscount, 'VND')}</span>
                  </div>
                )}
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">{tCheckout('shipping')}</span>
                  <span className="text-black dark:text-white">
                    {preview.shippingFee === 0 ? tCheckout('shippingFree') : formatCurrency(preview.shippingFee, 'VND')}
                  </span>
                </div>
                <hr className="my-3 border-neutral-200 dark:border-neutral-700" />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-black dark:text-white">{tCheckout('total')}</span>
                  <span className="text-black dark:text-white">{formatCurrency(preview.total, 'VND')}</span>
                </div>
              </div>
            )}

            {/* Coupon */}
            <div className="mt-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <TagIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value); setCouponError(''); }}
                    placeholder={tCheckout('couponPlaceholder')}
                    className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-9 pr-3 text-sm text-black placeholder-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500"
                    data-testid="coupon-input"
                  />
                </div>
                <button
                  onClick={() => applyCoupon(couponCode)}
                  className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-neutral-600 dark:hover:bg-neutral-500"
                >
                  {tCheckout('apply')}
                </button>
              </div>
              {couponError && (
                <p className="mt-2 text-sm text-red-500" data-testid="coupon-error">
                  {couponError}
                </p>
              )}
            </div>

            {error && (
              <p className="mt-3 text-sm text-red-500">{error}</p>
            )}

            {!selectedAddressId && !loading && (
              <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
                {tCheckout('selectAddress')}
              </p>
            )}

            <button
              onClick={handlePlaceOrder}
              disabled={placing || !selectedAddressId}
              title={!selectedAddressId ? tCheckout('selectAddressFirst') : undefined}
              className={clsx(
                'mt-4 w-full rounded-full py-3 text-sm font-semibold text-white transition-colors',
                placing || !selectedAddressId
                  ? 'cursor-not-allowed bg-neutral-400 dark:bg-neutral-600'
                  : 'bg-blue-600 hover:bg-blue-700'
              )}
            >
              {placing ? tCheckout('placingOrder') : tCheckout('placeOrder')}
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
