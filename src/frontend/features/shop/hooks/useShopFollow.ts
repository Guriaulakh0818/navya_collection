'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/stores';

export function useShopFollow(shop?: { id: string; slug?: string }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [followedShopIds, setFollowedShopIds] = useState<string[]>([]);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 1. Fetch user's followed shops on mount if logged in
  useEffect(() => {
    if (!user || user.id?.startsWith('guest')) {
      setFollowedShopIds([]);
      setIsFollowing(false);
      return;
    }

    fetch('/api/v1/user/followed-shops')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && Array.isArray(resData.data?.followedShopIds)) {
          setFollowedShopIds(resData.data.followedShopIds);
          if (shop?.id) {
            setIsFollowing(resData.data.followedShopIds.includes(shop.id));
          }
        }
      })
      .catch((err) => {
        console.warn('Failed to load user followed shops:', err);
      });
  }, [user, shop?.id]);

  // 2. Fetch specific shop follow status & follower count
  useEffect(() => {
    if (!shop?.slug && !shop?.id) return;
    const identifier = shop.slug || shop.id;

    fetch(`/api/v1/shop/${identifier}/follow`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data) {
          setFollowerCount(resData.data.followerCount || 0);
          if (typeof resData.data.isFollowing === 'boolean') {
            setIsFollowing(resData.data.isFollowing);
          }
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch shop follow status:', err);
      });
  }, [shop?.id, shop?.slug]);

  // 3. Toggle Follow
  const toggleFollow = useCallback(
    async (targetShop?: { id: string; slug?: string }) => {
      const activeShop = targetShop || shop;
      if (!activeShop) return false;

      if (!user || user.id?.startsWith('guest')) {
        const returnUrl = `/shop/${activeShop.slug || activeShop.id}`;
        router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
        return false;
      }

      setIsLoading(true);
      const prevFollowing = isFollowing;
      const prevCount = followerCount;

      // Optimistic update
      const newFollowingState = !prevFollowing;
      setIsFollowing(newFollowingState);
      setFollowerCount((prev) => Math.max(0, prev + (newFollowingState ? 1 : -1)));

      if (newFollowingState) {
        setFollowedShopIds((prev) => Array.from(new Set([...prev, activeShop.id])));
      } else {
        setFollowedShopIds((prev) => prev.filter((id) => id !== activeShop.id));
      }

      try {
        const identifier = activeShop.slug || activeShop.id;
        const res = await fetch(`/api/v1/shop/${identifier}/follow`, {
          method: 'POST',
        });
        const json = await res.json();

        if (json.requiresLogin) {
          const returnUrl = `/shop/${activeShop.slug || activeShop.id}`;
          router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
          return false;
        }

        if (json.success && json.data) {
          setIsFollowing(json.data.isFollowing);
          setFollowerCount(json.data.followerCount);
          if (json.data.isFollowing) {
            setFollowedShopIds((prev) => Array.from(new Set([...prev, activeShop.id])));
          } else {
            setFollowedShopIds((prev) => prev.filter((id) => id !== activeShop.id));
          }
          return json.data.isFollowing;
        } else {
          // Revert optimistic
          setIsFollowing(prevFollowing);
          setFollowerCount(prevCount);
          return prevFollowing;
        }
      } catch (err) {
        console.error('Error toggling shop follow:', err);
        // Revert
        setIsFollowing(prevFollowing);
        setFollowerCount(prevCount);
        return prevFollowing;
      } finally {
        setIsLoading(false);
      }
    },
    [user, shop, isFollowing, followerCount, router],
  );

  const isShopFollowed = useCallback(
    (shopId: string, shopSlug?: string) => {
      return (
        followedShopIds.includes(shopId) || Boolean(shopSlug && followedShopIds.includes(shopSlug))
      );
    },
    [followedShopIds],
  );

  return {
    followedShopIds,
    isFollowing,
    followerCount,
    isLoading,
    toggleFollow,
    isShopFollowed,
  };
}
