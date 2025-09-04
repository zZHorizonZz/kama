import { useState } from "react";
import { Link, Outlet, useLocation, useParams } from "react-router";
import { client } from "~/lib/client";
import { MdIcon, MdListItem, MdOutlinedButton, MdRipple, MdTextButton } from "react-material-web";
import type { Route } from "./+types/collection.detail.layout";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const { collectionId } = params;

  return await client.getCollectionService().getCollection({
    name: `collections/${collectionId}`,
  });
}

export default function Layout({ loaderData }: Route.ComponentProps) {
  const { collectionId } = useParams();

  const collection = loaderData;
  const location = useLocation();

  const [error, setError] = useState<string | null>(null);

  const handleDeleteCollection = async () => {
    if (!collectionId || !confirm("Are you sure you want to delete this collection?")) return;

    try {
      await client.getCollectionService().deleteCollection({
        name: `collections/${collectionId}`,
      });
      window.location.href = "/collections";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete collection");
    }
  };

  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.endsWith("/schema")) return "schema";
    if (path.endsWith("/rules")) return "rules";
    return "info";
  };

  if (error) {
    return <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>;
  }

  if (!collection) {
    return (
      <div className="py-12 text-center">
        <h2 className="font-semibold text-gray-900 text-xl">Collection not found</h2>
        <Link to="/collections" className="text-blue-600 hover:text-blue-800">
          Back to Collections
        </Link>
      </div>
    );
  }

  const currentTab = getCurrentTab();

  return (
    <div className="h-full space-y-6">
      <div className="flex flex-col">
        <div className="container flex w-full flex-row items-center justify-between pb-8">
          <div className="flex items-center">
            <Link to="/collections">
              <MdTextButton>
                <MdIcon slot="icon">apps</MdIcon>
                Collections
              </MdTextButton>
            </Link>
            <MdIcon>chevron_forward</MdIcon>
            <MdTextButton disabled>{collection.displayName || collection.name}</MdTextButton>
          </div>
          <div className="flex space-x-3">
            <Link to={`/collections/${collectionId}/records`}>
              <MdOutlinedButton>View Records</MdOutlinedButton>
            </Link>
            <button
              onClick={handleDeleteCollection}
              className="relative cursor-pointer rounded-full bg-md-sys-color-error px-6 py-2 text-md-sys-color-on-error text-md-sys-typescale-label-large transition-colors duration-300"
            >
              Delete
              <MdRipple />
            </button>
          </div>
        </div>
        <div className="border-md-sys-color-primary border-l-4 pl-6">
          <MdListItem>
            <h1 slot="headline" className="text-md-sys-typescale-display-small">
              {collection.displayName || collection.name}
            </h1>
            <p slot="supporting-text">{collection.id}</p>
          </MdListItem>
        </div>
        <div className="container w-full pt-6">
          <div className="flex items-center space-x-2">
            <Link
              to={`/collections/${collectionId}`}
              data-active={currentTab === "info"}
              className="relative flex w-full items-center justify-center bg-md-sys-color-secondary-container px-4 py-2 font-medium text-md-sys-color-on-secondary-container text-sm transition-all duration-200 data-[active=false]:rounded-md-sys-shape-corner-sm data-[active=true]:rounded-md-sys-shape-corner-xl data-[active=false]:rounded-l-md-sys-shape-corner-xl data-[active=true]:bg-md-sys-color-primary data-[active=true]:text-md-sys-color-on-primary"
            >
              {currentTab === "info" ? <MdIcon className="mr-1">check</MdIcon> : <MdIcon className="mr-1">info</MdIcon>}
              Info
              <MdRipple />
            </Link>
            <Link
              to={`/collections/${collectionId}/schema`}
              data-active={currentTab === "schema"}
              className="relative flex w-full items-center justify-center bg-md-sys-color-secondary-container px-4 py-2 font-medium text-md-sys-color-on-secondary-container text-sm transition-all duration-200 data-[active=false]:rounded-md-sys-shape-corner-sm data-[active=true]:rounded-md-sys-shape-corner-xl data-[active=true]:bg-md-sys-color-primary data-[active=true]:text-md-sys-color-on-primary"
            >
              {currentTab === "schema" ? (
                <MdIcon className="mr-1">check</MdIcon>
              ) : (
                <MdIcon className="mr-1">rule</MdIcon>
              )}
              Schema
              <MdRipple />
            </Link>
            <Link
              to={`/collections/${collectionId}/rules`}
              data-active={currentTab === "rules"}
              className="relative flex w-full items-center justify-center bg-md-sys-color-secondary-container px-4 py-2 font-medium text-md-sys-color-on-secondary-container text-sm transition-all duration-200 data-[active=false]:rounded-md-sys-shape-corner-sm data-[active=true]:rounded-md-sys-shape-corner-xl data-[active=false]:rounded-r-md-sys-shape-corner-xl data-[active=true]:bg-md-sys-color-primary data-[active=true]:text-md-sys-color-on-primary"
            >
              {currentTab === "rules" ? (
                <MdIcon className="mr-1">check</MdIcon>
              ) : (
                <MdIcon className="mr-1">schema</MdIcon>
              )}
              Rules
              <MdRipple />
            </Link>
          </div>
        </div>
      </div>

      {/* Render child pages */}
      <Outlet context={{ collection, error, setError }} />
    </div>
  );
}
