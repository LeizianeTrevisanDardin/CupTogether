import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import type {
  Coffee,
  NewCoffee,
} from "@/types/coffee";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type CoffeeContextType = {
  coffees: Coffee[];
  loading: boolean;

  loadCoffees: () => Promise<void>;

  addCoffee: (
    coffee: NewCoffee
  ) => Promise<void>;
};

const CoffeeContext =
  createContext<
    CoffeeContextType | undefined
  >(undefined);

type CoffeeProviderProps = {
  children: ReactNode;
};

export const CoffeeProvider = ({
  children,
}: CoffeeProviderProps) => {
  const { user } = useAuth();

  const [
    coffees,
    setCoffees,
  ] = useState<Coffee[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  // ==========================================
  // LOAD COFFEES
  // ==========================================

  const loadCoffees =
    useCallback(async () => {
      try {
        setLoading(true);

        // ======================================
        // 1. LOAD COFFEES
        // ======================================

        const {
          data: coffeeData,
          error: coffeeError,
        } = await supabase
          .from("coffees")
          .select("*")
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          )
          .limit(20);

        if (coffeeError) {
          throw coffeeError;
        }

        const coffeeRows =
          coffeeData ?? [];

        // ======================================
        // 2. GET UNIQUE USER IDS
        // ======================================

        const userIds = [
          ...new Set(
            coffeeRows
              .map(
                (item) =>
                  item.user_id
              )
              .filter(Boolean)
          ),
        ];

        // ======================================
        // 3. LOAD PROFILES
        // ======================================

        let profileMap:
          Record<
            string,
            {
              name?:
                | string
                | null;

              avatar_url?:
                | string
                | null;
            }
          > = {};

        if (
          userIds.length >
          0
        ) {
          const {
            data:
              profileData,

            error:
              profileError,
          } = await supabase
            .from(
              "profiles"
            )
            .select(
              "id, name, avatar_url"
            )
            .in(
              "id",
              userIds
            );

          if (
            profileError
          ) {
            console.error(
              "Error loading coffee profiles:",
              profileError
            );
          } else {
            profileMap =
              (
                profileData ??
                []
              ).reduce(
                (
                  map,
                  profile
                ) => {
                  map[
                    profile.id
                  ] = {
                    name:
                      profile.name,

                    avatar_url:
                      profile.avatar_url,
                  };

                  return map;
                },
                {} as Record<
                  string,
                  {
                    name?:
                      | string
                      | null;

                    avatar_url?:
                      | string
                      | null;
                  }
                >
              );
          }
        }

        // ======================================
        // 4. FORMAT COFFEES
        // ======================================

        const formattedCoffees:
          Coffee[] =
          coffeeRows.map(
            (item) => {
              const profile =
                profileMap[
                  item.user_id
                ];

              return {
                id:
                  item.id,

                userId:
                  item.user_id,

                userName:
                  profile?.name ??
                  item.user_name ??
                  "Coffee Friend",

                userAvatarUrl:
                  profile
                    ?.avatar_url ??
                  null,

                coffeeShop:
                  item.coffee_shop,

                order:
                  item.order_name ??
                  "",

                rating:
                  item.rating ??
                  0,

                thoughts:
                  item.thoughts ??
                  "",

                location:
                  item.location ??
                  "",

                latitude:
                  item.latitude !==
                  null
                    ? Number(
                        item.latitude
                      )
                    : undefined,

                longitude:
                  item.longitude !==
                  null
                    ? Number(
                        item.longitude
                      )
                    : undefined,

                imageUrl:
                  item.image_url ??
                  undefined,

                createdAt:
                  item.created_at,

                groupId:
                  item.group_id ??
                  null,
              };
            }
          );

        setCoffees(
          formattedCoffees
        );
      } catch (error) {
        console.error(
          "Error loading coffees:",
          error
        );

        setCoffees([]);
      } finally {
        setLoading(false);
      }
    }, []);

  // ==========================================
  // ADD COFFEE
  // ==========================================

  const addCoffee = async (
    coffee: NewCoffee
  ) => {
    const {
      data,
      error,
    } = await supabase
      .from("coffees")
      .insert({
        user_id:
          coffee.userId,

        user_name:
          coffee.userName,

        coffee_shop:
          coffee.coffeeShop,

        order_name:
          coffee.order,

        rating:
          coffee.rating,

        thoughts:
          coffee.thoughts,

        location:
          coffee.location ??
          null,

        latitude:
          coffee.latitude ??
          null,

        longitude:
          coffee.longitude ??
          null,

        image_url:
          coffee.imageUrl ??
          null,

        group_id:
          coffee.groupId ??
          null,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // ======================================
    // LOAD CURRENT USER PROFILE
    // ======================================

    const {
      data: profileData,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select(
        "name, avatar_url"
      )
      .eq(
        "id",
        coffee.userId
      )
      .maybeSingle();

    if (profileError) {
      console.log(
        "Error loading profile after coffee insert:",
        profileError
      );
    }

    // ======================================
    // FORMAT NEW COFFEE
    // ======================================

    const newCoffee:
      Coffee = {
      id:
        data.id,

      userId:
        data.user_id,

      userName:
        profileData
          ?.name ??
        data.user_name ??
        "Coffee Friend",

      userAvatarUrl:
        profileData
          ?.avatar_url ??
        null,

      coffeeShop:
        data.coffee_shop,

      order:
        data.order_name ??
        "",

      rating:
        data.rating ??
        0,

      thoughts:
        data.thoughts ??
        "",

      location:
        data.location ??
        "",

      latitude:
        data.latitude !==
        null
          ? Number(
              data.latitude
            )
          : undefined,

      longitude:
        data.longitude !==
        null
          ? Number(
              data.longitude
            )
          : undefined,

      imageUrl:
        data.image_url ??
        undefined,

      createdAt:
        data.created_at,

      groupId:
        data.group_id ??
        null,
    };

    // ======================================
    // UPDATE LOCAL STATE
    // ======================================

    setCoffees(
      (
        currentCoffees
      ) => [
        newCoffee,
        ...currentCoffees,
      ]
    );
  };

  // ==========================================
  // RELOAD WHEN LOGIN CHANGES
  // ==========================================

  useEffect(() => {
    if (user) {
      loadCoffees();
    } else {
      setCoffees([]);
      setLoading(false);
    }
  }, [
    user,
    loadCoffees,
  ]);

  // ==========================================
  // PROVIDER
  // ==========================================

  return (
    <CoffeeContext.Provider
      value={{
        coffees,
        loading,
        loadCoffees,
        addCoffee,
      }}
    >
      {children}
    </CoffeeContext.Provider>
  );
};

// ==========================================
// HOOK
// ==========================================

export function useCoffee() {
  const context =
    useContext(
      CoffeeContext
    );

  if (!context) {
    throw new Error(
      "useCoffee must be used inside CoffeeProvider"
    );
  }

  return context;
}