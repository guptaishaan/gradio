<script lang="ts">
	import { untrack } from "svelte";

	let { node, children, ...rest } = $props();

	let component = $derived(await node.component);
	let runtime = $derived(
		(await node.runtime) as {
			mount: typeof import("svelte").mount;
			unmount: typeof import("svelte").unmount;
		}
	);
	let el: HTMLElement | null = $state(null);

	$effect(() => {
		if (!el || !runtime || !component) return;

		// Read prop references so the effect re-runs when the node is
		// replaced during a dev reload (new objects are created by
		// app_tree.reload).
		const _shared_props = node.props.shared_props;
		const _props = node.props.props;
		const _runtime = runtime;

		// The custom component runs in its own Svelte runtime instance, so
		// its synchronous init cannot reset *this* runtime's tracking
		// context. Without untrack(), every core $state read the component
		// makes while mounting (e.g. the Gradio class copying
		// shared_props/props) becomes a dependency of this effect, and every
		// later prop update unmounts and remounts the component.
		const mounted = untrack(() =>
			_runtime.mount(component.default, {
				target: el!,
				props: {
					shared_props: _shared_props,
					props: _props,
					children
				}
			})
		);

		return () => {
			_runtime.unmount(mounted);
		};
	});
</script>

<span bind:this={el}></span>
